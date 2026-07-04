# Documentation

Architecture and design notes for the agent workspace: an AI-assisted task
management app whose AI agents live in a Pokémon-GBA-style pixel village.

The project vision and working conventions live in
[AGENTS.md](../AGENTS.md) — that's the starting point for anyone (human or
agent) working in this repo. New files in this folder are named
lowercase-kebab-case.

## Index

| Document | What it covers |
| --- | --- |
| [interactive-world-canvas.md](./interactive-world-canvas.md) | The agent-village canvas: packages, sizing model, showcase, later milestones. **Start here** for the current feature work. |
| [goals.md](./goals.md) | The goal construct: model, kanban stages, cost tracking, deadline reminders, and how it supersedes task groups. |
| [architecture.md](./architecture.md) | The layered model (headless core → adapter → React → app), package responsibilities, the 2.5D grid model, dependency rules, data flow. |
| [design-decisions.md](./design-decisions.md) | Rationale and trade-offs behind the choices the codebase embodies (plain objects, immutability, source-first exports, …). |
| [getting-started.md](./getting-started.md) | Setup, common commands, workflow, project structure, troubleshooting. |
| [tech-stack.md](./tech-stack.md) | Technologies in `apps/web` and workspace tooling; the Clerk + Convex auth flow. |
| [deployment.md](./deployment.md) | Deploying `apps/web` to Cloudflare Workers and Storybook to Chromatic. |
| [clerk-auth-cost-projection.md](./clerk-auth-cost-projection.md) | Clerk pricing model, growth scenarios, and COGS analysis. |

## Reading paths

- **"What is this project?"** — [AGENTS.md](../AGENTS.md), then
  [interactive-world-canvas.md](./interactive-world-canvas.md).
- **"I want to contribute code."** — [getting-started.md](./getting-started.md),
  then [architecture.md](./architecture.md), with
  [design-decisions.md](./design-decisions.md) as needed.
- **"I'm shipping to production."** — [deployment.md](./deployment.md) and
  [tech-stack.md](./tech-stack.md).

When a change affects public API or architecture, update the relevant doc
(and the package README) in the same PR.
