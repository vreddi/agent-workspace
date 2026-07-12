# Claude Code instructions

All project context and conventions live in one place, shared by every
agent tool that works in this repo:

@AGENTS.md

# Planning workflow for this repo

When planning a feature, run the orchestrator agent (Fable). It researches and
produces a short plan, then delegates implementation to the implementer subagent
(Opus 4.8). This is opt-in, not the default — normal sessions are unaffected.

## Trigger it

- `claude --agent orchestrator` for an interactive planning session, or
- `@agent-orchestrator ...` for a one-shot within a normal session, or
- `/plan-feature <description>`.

## Workflow

1. Orchestrator researches (heavy search -> Explore, on Haiku).
2. Orchestrator produces a short plan and gets approval.
3. Orchestrator hands the plan to the implementer (Opus 4.8), which codes it.
4. Implementer returns a concise summary; orchestrator reviews and reports back.

## Cost

Short plans, tight delegation prompts. One implementer per unit of work;
parallelize only truly independent subtasks. Summaries, not full file contents.
