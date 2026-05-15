<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

---

# Grid-Based World Package Suite

## Project Overview

We are building an open-source TypeScript monorepo toolkit for creating 2D interactive worlds. The core idea:

> **A logical grid-based simulation world rendered with freeform-looking, artistic 2D visuals.**

This is NOT a full game engine. It is a composable foundation for building map editors, agent simulations, cozy 2D worlds, AI-controlled characters, and interactive sandbox environments.

## Core Architecture Principle

```
Logical world state
  ↓
Simulation and rules
  ↓
Actions/intents
  ↓
Rendering adapter
  ↓
UI/editor integrations
```

**Separation of concerns is critical:**
- No rendering details in simulation
- No React in core packages
- No AI-provider-specific code in actions
- Actions as the AI control boundary

## Visual Philosophy

Internally: grid-based (predictable, logical, testable)
Externally: freeform-looking (organic, cozy, artistic)

Positions snap to grid cells, but objects render with offsets, rotation, shadows, and organic shapes. Characters move cell-to-cell but animate smoothly.

## Package Organization

**Core packages (Milestone 1):**
- `core` — Shared types, EntityId, events, schemas
- `grid` — Grid logic, coordinates, neighbors, bounds
- `world` — World state, entities, terrain, serialization
- `agents` — Agent model, state, traits
- `actions` — Structured action types, validation, registry
- `pathfinding` — A* pathfinding, movement cost
- `simulation` — Simulation engine, tick loop, action dispatch
- `bundle` — Re-export common APIs

**Optional packages (later milestones):**
- `assets`, `movement`, `renderer`, `renderer-pixi`, `react`, `editor`, `ai`

See `docs/` folder for detailed architecture and package responsibilities.

## First Milestone: Headless Simulation

Deliver a working core WITHOUT rendering:
- ✓ Monorepo scaffold
- ✓ Core types and grid system
- ✓ World state model
- ✓ Agent creation and management
- ✓ Structured action system
- ✓ A* pathfinding
- ✓ Simulation engine with tick loop
- ✓ Event emission
- ✓ Tests and example script

Do NOT implement: PixiJS, React, visual polish, editor, AI providers.

## Data Model

Prefer serializable plain objects:
```ts
type Agent = {
  id: string;
  position: GridPosition;
  facing?: Direction;
  state: AgentState;
};
```

Not class-heavy. World state should be easy to save, load, diff, and inspect.

## AI Safety

**AI can suggest:** move, say, wait, use, inspect, pickup, drop  
**Simulation validates:** existence, reachability, occupancy, permissions

Actions are structured JSON → safe for parsing, validation, and serialization.

## Testing

Use **vitest**. Write tests for:
- Grid logic (bounds, neighbors, occupancy)
- Pathfinding (valid, blocked, no solution)
- Actions (valid, invalid, failed)
- Events and serialization
- Simulation tick behavior

## Documentation

- **CLAUDE.md** (this file) — Project context for AI
- **docs/VISION.md** — Why we're building this
- **docs/ARCHITECTURE.md** — Package structure and data flow
- **docs/GETTING_STARTED.md** — Dev setup
- **docs/DESIGN_DECISIONS.md** — Key choices

Each package has its own README with purpose and API.

## Next Steps

1. Create docs folder with vision and architecture guides
2. Scaffold package structure with Nx
3. Implement core packages (Milestone 1)
4. Write tests and example script
5. Later: rendering layer, React, editor, AI
