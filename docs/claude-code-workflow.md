# Claude Code workflow: Fable plans, Opus implements

This repo has an opt-in workflow where planning/advisory work runs on Claude
Fable 5 and implementation runs on Claude Opus 4.8. It is triggered on demand
when you plan a feature — normal Claude Code sessions are unaffected. The split
keeps our most expensive model on short, high-value planning and lets Opus do the
heavy coding.

## How it works

- **orchestrator** (`.claude/agents/orchestrator.md`) runs on Fable 5 at high
  effort. It researches, advises, and produces a short plan. It has no edit
  tools, so it cannot modify code and must delegate.
- **implementer** (`.claude/agents/implementer.md`) runs on Opus 4.8 at high
  effort. It receives the approved plan and does the actual coding, tests, edits.
- **Explore** (`.claude/agents/Explore.md`) is pinned to Haiku so codebase search
  stays cheap. Without this override it would inherit Fable, our priciest model.

## Triggering it

Pick whichever fits:

- **Dedicated planning session:** `claude --agent orchestrator`. Your session
  becomes the Fable planner; it plans, you approve, it delegates to Opus. Best
  for interactive plan approval, and it keeps the orchestrator's spawn allowlist
  active. Start a normal `claude` session again when you're done.
- **One-shot in an existing session:** `@agent-orchestrator plan the X feature`.
  Runs Fable planning + Opus implementation in isolated context; only the summary
  returns to your main thread. More autonomous.
- **Slash command:** `/plan-feature <description>` wraps the above with an
  explicit "approve before implementing" step.

## Cost notes

- Keep planning prompts tight; Fable at high effort is our most expensive path.
- Implementer summaries return into the orchestrator's context (Fable input
  tokens). Ask for concise summaries; parallelize implementers only for genuinely
  independent subtasks.
- Check spend with `/cost` and current model/effort with `/status`.

## Tweaks

- To route all subagents to Opus regardless of file config, set
  `CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-4-8`. Note this also drags Explore off
  Haiku.

## Requirements

- Both `fable` and `claude-opus-4-8` must be in your account/org available models,
  or Claude Code silently falls back to the inherited model.
- Needs Claude Code v2.1.198 or later (for per-agent `effort` and nested subagents).
