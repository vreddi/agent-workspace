# Architecture

> **Scope:** this doc covers the **world-canvas engine** — the headless
> `@worldkit/*` packages and how they layer up into the pixel village. For
> the app's data model (tasks, goals, metrics, reminders) see
> [goals.md](./goals.md), [metrics.md](./metrics.md), and
> [task-assignments.md](./task-assignments.md); the root
> [AGENTS.md](../AGENTS.md) has the table-by-table map.

How the pieces fit together: headless `@worldkit/*` simulation packages at
the bottom, React packages that compose them into the agent-village canvas,
and the task app (`apps/web` + Convex) on top.

For _why_ the project exists, see [AGENTS.md](../AGENTS.md). For the village
canvas feature itself, see
[interactive-world-canvas.md](./interactive-world-canvas.md).

## Layered model

```
┌─────────────────────────────────────────────────┐
│  App — apps/web                                 │
│  TanStack Start routes, Clerk auth, Convex data │
│  (tasks, groups, users); /world renders the     │
│  village full-bleed                             │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  React — @worldkit/world-canvas,                │
│  @worldkit/sprite-actor, @org/ui                │
│  components, hooks, CSS transitions             │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Adapter — @worldkit/tilemap                    │
│  Canvas2D TilemapRenderer + mapToWorld bridge   │
│  (framework-agnostic, no React)                 │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│  Headless core — @worldkit/grid, world,         │
│  agents, pathfinding, tilemap (tiles + maps)    │
│  pure data + logic, no rendering, no React      │
└─────────────────────────────────────────────────┘
```

**Invariant: headless core → adapter → React.** Simulation and data packages
contain no rendering and no React; React packages compose them. The one
deliberate middle ground is `@worldkit/tilemap`, which is headless data
(tiles, maps, world bridge) plus a framework-agnostic Canvas2D renderer —
still no React.

## Package responsibilities

### Headless (`tsdown` + `vitest`, publishable)

| Package                 | Responsibility                                                                                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@worldkit/grid`        | Grid coordinate system: `GridPosition { x, y, z }`, `GridConfig { width, height, layers, cellSize }`, bounds checks, 4-way neighbors, vertical neighbors, grid↔world-pixel conversion, `Direction` (N/E/S/W). Zero runtime dependencies. |
| `@worldkit/world`       | World state: terrain cells, objects, occupancy, standability, JSON-serializable `World` record. Immutable update helpers (`setTerrain`, `addObject`, …) return new worlds.                                                               |
| `@worldkit/agents`      | Agent model: identity, position, facing, state (idle/moving/…). No AI, no behavior — a serializable description of a character.                                                                                                          |
| `@worldkit/pathfinding` | A\* over a `World`: shortest 4-way path or `undefined`, custom movement cost, ramp-aware layer transitions.                                                                                                                              |
| `@worldkit/tilemap`     | GBA-style pixel art (`parsePixelArt`, `CharGrid`), the `COZY_TILESET`, ASCII map authoring (`parseMap`), `mapToWorld` bridge, and the Canvas2D `TilemapRenderer` (ground + overhang canvases, animated water/flowers).                   |

### React (private, source-only)

| Package                  | Responsibility                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@worldkit/sprite-actor` | `<SpriteActor>` — sprite-sheet character component: named actions, one-shot vs looping animations, facing flips, pixelated rendering.                                                       |
| `@worldkit/world-canvas` | The village: `<VillageCanvas>`, `<WorldCanvas>` stage, `<DialogueBox>`, `<SpeechBubble>`, and `useVillageSimulation` (per-agent state machine: idle → wander via A\* → chat → return home). |
| `@org/ui`                | Shared shadcn/radix-style UI components for the app.                                                                                                                                        |

### App layer

- `apps/web` — TanStack Start (React 19) on Cloudflare Workers. Clerk auth,
  Convex for data. Authenticated routes (`today`, `day`, `groups`, `tasks`)
  are the task app; the public `/world` route renders the village.
- `convex/` — schema and functions for tasks, groups, todos, users, plus the
  Clerk webhook and auth config.
- `apps/storybook` — Storybook 10, auto-globs stories from
  `packages/*/src/**/*.stories.tsx`.
- `examples/pixi-playground` — standalone PixiJS demo of the headless
  packages.

## The 2.5D model

The world is logically a stack of grid layers along the `z` axis. The sim
stays grid-discrete and testable; only renderers draw depth.

- Cells are addressed by `(x, y, z)`. Terrain at `(x, y, 0)` and `(x, y, 1)`
  are independent tiles.
- A cell is **standable** iff it has non-blocking terrain AND no blocking
  object. **Empty = air**: a cell with no terrain is not enterable — every
  walkable cell needs an explicit floor tile.
- Horizontal neighbors stay on the same `z`. There is no free vertical
  adjacency; agents change layers only via **ramp** tiles.

### Ramps

A terrain tile may carry `ramp: { up: Direction }` to act as a one-cell
slope. If a ramp at `(x, y, z)` has `up: 'east'`:

- Standing on it, stepping east lands you at `(x+1, y, z+1)`.
- Standing at `(x+1, y, z+1)`, stepping west brings you back down onto it.

`findPath` handles both directions automatically. Both endpoints must be
standable; ramps don't synthesize floors.

### Out of scope (for now)

- **No gravity.** An agent at `(x, y, 3)` with no floor below does not fall.
- **No tall agents.** Agents occupy exactly one `(x, y, z)` cell.
- **No diagonal ramps.** Slopes face N/E/S/W only.

The current village renders a single layer top-down; the z-axis exists so
multi-level maps and an isometric renderer can be added without touching the
logic packages.

## Sizing model

- Logical cell = **32 world px** (`cellSize: 32`).
- Tile art is authored at **native 32×32** (tree 32×64, house 96×96), the
  same pixel density as the 32×32 character frames.
- The whole stage scales by an integer `zoom` with
  `image-rendering: pixelated`.

## Dependency graph

```
apps/web ──────────────► @worldkit/world-canvas, @org/ui, convex/
@worldkit/world-canvas ─► sprite-actor, tilemap, pathfinding, agents, world, grid
@worldkit/tilemap ──────► world, grid
@worldkit/pathfinding ──► world, grid
@worldkit/agents ───────► grid
@worldkit/world ────────► grid
@worldkit/grid ─────────► (nothing)
```

**Rule:** packages only import downward. No upward imports, no cycles, and
no React below the React layer.

## Data flow: one villager taking a stroll

1. `useVillageSimulation` (React) decides an idle agent should wander and
   picks a target cell.
2. `findPath` (`@worldkit/pathfinding`) returns a 4-way path over the
   `World` produced by `mapToWorld` (`@worldkit/tilemap`).
3. The hook advances the agent one cell per step; `<WorldCanvas>` positions
   the `<SpriteActor>` at the new cell and a CSS transition glides it over —
   grid inside, cozy outside.
4. `TilemapRenderer`'s overhang canvas draws tree canopies and roofs above
   the character; `zIndex: 10 + cellY` keeps characters sorted.
5. On arrival the state machine returns to idle, chats with a neighbor
   (`<SpeechBubble>`, `<DialogueBox>`), or heads home.

Nothing in steps 2–4 knows about React state or Convex; the hook is the only
place simulation meets UI. As task features land, agents' destinations and
dialogue will be driven by real task data from Convex through the same seam.
