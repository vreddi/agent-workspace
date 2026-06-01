# Documentation

Welcome to the WorldKit documentation. Here's a guide to what you'll find:

## Quick Navigation

### 🎯 [VISION.md](./VISION.md)
**Start here if you're new.** Explains why we're building this, what problem it solves, and what makes it different from existing solutions. Good for understanding the big picture and use cases.

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
**Then read this.** Deep dive into the package structure, data flow, and responsibilities of each package. Includes diagrams and examples. Read this if you want to understand how the pieces fit together.

### 🚀 [GETTING_STARTED.md](./GETTING_STARTED.md)
**For developers.** Setup instructions, common commands, workflow guide, troubleshooting. Read this before you start coding.

### 💭 [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md)
**For the curious.** Explains the "why" behind architectural choices (plain objects vs. classes, actions as boundaries, immutable updates, etc.). Read this if you want to understand trade-offs and rationale.

### 💰 [clerk-auth-cost-projection.md](./clerk-auth-cost-projection.md)
**For planning & ops.** Cost projection and COGS analysis for Clerk authentication — pricing model, billed-MAU vs. registered accounts, growth scenarios, and upgrade triggers for the Website Launch.

---

## Document Overview

| Document | Purpose | Audience | Length |
|----------|---------|----------|--------|
| [VISION.md](./VISION.md) | Why this project exists, problem statement, use cases | Everyone, especially stakeholders | 5-10 min |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Package structure, data flow, dependencies | Developers, architects | 15-20 min |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Setup, commands, development workflow | Developers | 10-15 min |
| [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) | Rationale for key choices, trade-offs | Developers, future maintainers | 15-20 min |
| [clerk-auth-cost-projection.md](./clerk-auth-cost-projection.md) | Clerk auth pricing model, growth projections, COGS | Founders, ops, finance | 10-15 min |

---

## Reading Paths

### "I just want to understand what this is"
1. [VISION.md](./VISION.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md) (skim the diagrams)

**Time:** ~15 minutes

### "I want to contribute code"
1. [VISION.md](./VISION.md) (skim)
2. [ARCHITECTURE.md](./ARCHITECTURE.md) (full read)
3. [GETTING_STARTED.md](./GETTING_STARTED.md)
4. [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) (as needed)

**Time:** ~1 hour

### "I want to understand the design philosophy"
1. [VISION.md](./VISION.md) (full read)
2. [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) (full read)
3. [ARCHITECTURE.md](./ARCHITECTURE.md) (reference)

**Time:** ~45 minutes

### "I'm debugging something and want to understand a specific choice"
→ Use CTRL+F to search [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md)

---

## Key Concepts (TL;DR)

### Grid-Based Logic, Freeform Visuals
- Simulation uses grid coordinates (discrete, deterministic)
- Rendering adds organic freeform visuals (offsets, rotation, shadows)
- Keeps logic simple and testing easy while enabling beautiful art

### Actions as Control Boundary
- External agents (AI, players) propose **actions**, not direct mutations
- Simulation **validates** actions before applying them
- All changes go through a single, auditable gate
- Safe for AI, safe for multiplayer, safe for undo/redo

### Plain Objects > Classes
- World state is serializable plain data, not opaque classes
- Easy to save/load, test, diff, replay, and understand
- Update helpers maintain immutability

### Modular Packages
- One concern per package (grid, world, actions, simulation, etc.)
- Clear dependency hierarchy: core → grid/world/agents → pathfinding → simulation
- Optional layers: rendering, React, editor, AI
- No upward imports; no circular dependencies

### Events Over Direct Calls
- Simulation emits typed events
- Multiple listeners can react to the same event
- Good for undo/redo, logging, multiplayer, testing

---

## Current Status

**Milestone 1 (In Progress):** Headless simulation
- Core types and grid system
- World state model
- Agent creation and management
- Structured action system
- A* pathfinding
- Simulation engine with tick loop
- Event emission
- Tests and examples

**Future Milestones:**
- Milestone 2: Rendering layer (PixiJS, Canvas, etc.)
- Milestone 3: React integration and editor tools
- Milestone 4: AI integration helpers
- Beyond: Community assets, plugins, extensions

---

## Glossary

**Grid Position:** `{ x: number; y: number }` — A discrete cell coordinate on the world grid

**Action:** Structured JSON proposal by an external agent (AI, player, script) to change world state

**Simulation:** The engine that validates actions and updates world state

**Event:** Notification emitted by the simulation (e.g., "agent moved", "action failed")

**World State:** Plain data object containing entities, terrain, agents, and metadata

**Entity:** A thing in the world (object, decoration) with a position

**Agent:** A special entity that can move, act, and be controlled by AI

**Render Adapter:** Optional layer that converts world state into graphics

---

## Contributing

When adding features or making changes:

1. **Check the existing documentation** to understand the architecture
2. **Follow the design principles** in DESIGN_DECISIONS.md
3. **Update relevant docs** if your change affects public API or architecture
4. **Keep packages focused** — one concern per package
5. **Test headless first** — don't add rendering to simulation logic
6. **Write readable code** — clarity > cleverness

---

## Questions?

- Check the relevant documentation file
- Look at test files for examples
- Search the docs with CTRL+F
- Check package READMEs
- Open an issue

---

Happy building! 🌍
