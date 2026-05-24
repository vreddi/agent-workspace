---
description: Implement the most recent plan by orchestrating Claude workers in Herdr panes
---

# /herdr-ship — execute the just-finalised plan via Herdr-orchestrated workers

Use this immediately after a plan has been finalised in the current session (typically via `/plan` + `ExitPlanMode`, with the plan file under `~/.claude/plans/`). Your job is to **orchestrate** — spin up isolated Claude workers in Herdr panes, hand each a focused scope, and let them do the actual file edits. **Do not implement the feature yourself in this session.**

## Prerequisites — check before spawning

Workers run with `claude --bare`, which strips CLAUDE.md auto-discovery, auto-memory, hooks, plugin sync, and keychain reads (huge per-session token savings). The tradeoff: **`--bare` does NOT read OAuth or the keychain.** Workers must authenticate via `ANTHROPIC_API_KEY` env var or `apiKeyHelper` in settings.

Before you spawn anything, run:
```sh
[ -n "${ANTHROPIC_API_KEY:-}" ] && echo "ok: env" \
  || grep -q '"apiKeyHelper"' ~/.claude/settings.json 2>/dev/null && echo "ok: apiKeyHelper" \
  || echo "MISSING: set ANTHROPIC_API_KEY or configure apiKeyHelper in ~/.claude/settings.json"
```

If MISSING, stop and tell the user — give them the two options (export the env var for the Herdr server's environment, or configure `apiKeyHelper`) and wait. Do NOT silently fall back to non-bare; the user explicitly wants bare workers.

## Workflow

1. **Find the plan.**
   - First, look for a plan referenced earlier in the current conversation.
   - Otherwise, take the most recently modified file in `~/.claude/plans/`.
   - Read it in full before deciding anything.

2. **Decide the agent split.** Use the plan's "Critical files" / structure to choose 1–3 parallel scopes. Typical splits:
   - **Backend + UI** for most full-stack features
   - **Single agent** for small, contained changes
   - **Per package / per sub-system** when boundaries are obvious

   Keep it simple. **No reviewer / QA / test-runner agent** unless the plan explicitly calls for one.

3. **Write a scope prompt per agent** to `/tmp/herdr-<slug>-prompt.md`. Each prompt MUST be self-contained — the spawned agent has zero context from the current session. Include:
   - Absolute path to the plan file (mandatory full read).
   - 3–6 mandatory existing files to read for pattern-matching.
   - Explicit scope ("DO ONLY these") and explicit non-scope ("DO NOT touch X").
   - The cross-agent API contract if multiple agents coordinate, so neither blocks on the other.
   - Hard constraints (validators, idioms, anti-patterns) lifted from the plan + repo guidelines.
   - Verification steps (typecheck command, manual smoke) and a commit instruction at the end.
   - "Report back and stop" at the end so the worker doesn't keep going.

4. **Spin up workers as split panes from the orchestrator's current pane** (do NOT create new tabs — the user wants them visible alongside). Find the active workspace with `herdr workspace list` (the one with `"focused": true`). For each scope:

   ```sh
   herdr agent start <slug> --workspace <ws_id> --split <right|down> --no-focus \
     --cwd /Users/vishrutreddi/Developer/agent-workspace -- \
     claude --bare --permission-mode bypassPermissions --model claude-opus-4-7 \
       --add-dir /Users/vishrutreddi/Developer/agent-workspace \
       "Read /tmp/herdr-<slug>-prompt.md and execute every step in order. Do not deviate from scope."
   ```

   Split-direction convention for the common 2-worker case:
   - First worker: `--split right` (lands to the right of the orchestrator)
   - Second worker: `--split down` (lands below the orchestrator)

   For a single worker: `--split right`. For three: `right`, `down`, then `down` on the right pane (target it explicitly with `--tab` or accept the focused-pane default).

   **Always pass to `claude`:**
   - `--bare` — skips CLAUDE.md auto-load, auto-memory, hooks, plugin sync, keychain reads (token savings). Workers get only the prompt file you wrote for them. **Requires API-key auth (see Prerequisites above).**
   - `--permission-mode bypassPermissions` — workers run hands-off, no approval prompts (user has consented for spawned implementation workers)
   - `--model claude-opus-4-7` — Opus 4.7 for product-quality implementation work
   - `--add-dir /Users/vishrutreddi/Developer/agent-workspace` — grants tool access to the repo root (bare mode otherwise restricts to CWD only; this lets workers edit anywhere in the repo)

   **Always pass to `herdr agent start`:** `--no-focus` so the user stays in their orchestrator pane.

   The prompt file at `/tmp/herdr-<slug>-prompt.md` is the worker's only context — make sure it is fully self-contained (relevant file paths, conventions, API contracts, scope, verification steps).

5. **Report back to the user.** Tell them which tabs were created, which agents are running, and how to monitor them (`herdr tab list`, `herdr agent list`, or attach via Herdr's keybindings). Do NOT block waiting for the agents to finish — they run async; surface a one-line status and return control.

## Token discipline

- Spawned implementation agents: **always Opus 4.7** (`claude-opus-4-7`). This is the product surface.
- If YOU (the orchestrator) need to research, look files up, or analyse, use the `Agent` tool with `model: "sonnet"` or `model: "haiku"`. Don't burn Opus tokens on read-only investigation.

## Anti-patterns

- Spawning a reviewer / linter / test-runner agent unless the plan explicitly says so.
- Letting workers drift out of scope — be explicit about boundaries in the prompt.
- Watching workers in real time — they're async; return control to the user.
- Editing files yourself instead of dispatching workers — the whole point is parallel execution under your direction.
