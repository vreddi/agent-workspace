# Design decisions

The "why" behind choices the codebase still embodies. Structural invariants
are summarized in [AGENTS.md](../AGENTS.md); this file keeps the fuller
rationale and trade-offs.

## 1. Plain objects, not class trees

**Decision:** World and agent state are plain serializable data (objects,
arrays, primitives), not encapsulated classes.

```ts
// ✅ What we do
type World = {
  id: string;
  grid: GridConfig;
  terrain: Record<string, TerrainCell>;
  objects: Record<EntityId, WorldObject>;
};

// ❌ What we avoid
class World {
  private terrain = new Map();
  getTerrain(key) { /* ... */ }
}
```

**Why:**
- **Serialization:** save/load as JSON with no custom serializers
- **Testing:** trivial to construct fixtures and compare states
- **Debugging:** inspectable in the console, diffable in logs
- **Sync:** easy to diff, patch, or send over the wire (Convex-friendly)
- **AI:** models reason about structured data better than opaque instances

**Tradeoff:** less encapsulation — update helpers must not mutate shared
state. TypeScript `readonly` and the helper convention below keep this
honest.

## 2. Immutable updates via helper functions

**Decision:** state changes go through helpers that return new objects
(`setTerrain(world, cell) → World`, `setAgentPosition(agent, pos) → Agent`),
never in-place mutation.

**Why:** deterministic replay, easy undo/redo later, no aliasing bugs when
React state and simulation share references, and cheap structural diffing.

**Tradeoff:** slightly more allocation. Worlds are small; clarity wins.

## 3. Headless core → adapter → React

**Decision:** simulation/data packages (`grid`, `world`, `agents`,
`pathfinding`, the data half of `tilemap`) contain no rendering and no
React. `tilemap`'s Canvas2D renderer is framework-agnostic; only
`sprite-actor` and `world-canvas` know React exists.

**Why:**
- **Headless:** logic runs in tests, Node, workers — no browser needed
- **Swappable rendering:** the same `World` powers the Canvas2D village
  today and the PixiJS playground (`examples/pixi-playground`); an
  isometric or Pixi adapter can be added without touching logic
- **Testable:** vitest covers grid math, parsing, and pathfinding directly;
  visual components are covered by Storybook stories instead

**Tradeoff:** the React layer maps events/state into visuals itself. That
mapping is thin by design.

## 4. Grid inside, cozy outside

**Decision:** logic snaps to discrete 32px grid cells; visuals animate
smoothly between them (cell-to-cell CSS transitions, animated tiles,
overhang canopies).

**Why:**
- **Determinism:** collision, occupancy, and pathfinding are exact —
  "is the agent at cell (5,3)?" is always true or false
- **Artistry:** the rendered village still feels organic and alive
- **Simplicity:** no floating-point position bugs in the simulation

**Tradeoff:** renderers do the grid→pixel mapping. Small, contained cost.

## 5. 2.5D with explicit floors and ramps

**Decision:** positions are `(x, y, z)`. Empty cells are air — a cell is
standable only with a non-blocking floor tile and no blocking object.
Layers connect only through ramp tiles (`ramp: { up: Direction }`), which
the pathfinder traverses in both directions automatically.

**Why:** keeps multi-level maps fully grid-discrete and testable, with no
physics. No gravity, no tall agents, no diagonal ramps — each would add
simulation complexity the village doesn't need yet.

**Tradeoff:** map authors must lay explicit floors. `parseMap` makes that
cheap.

## 6. Pixel density is 1:1

**Decision:** tile art is authored at native 32×32 (tree 32×64, house
96×96) to match the 32×32 character sprites, and the stage scales by an
integer `zoom` with `image-rendering: pixelated`. Art is authored with the
`CharGrid` builder in `@worldkit/tilemap`, not hand-typed strings.

**Why:** the world and its residents share one level of crispness — mixed
densities read as blurry or toy-like. `CharGrid` (fills, rects, ellipses)
keeps 32×32+ art editable; hand-typed string art stops scaling past trivial
tiles.

## 7. One concern per package, imports point down

**Decision:** small focused packages with a strict hierarchy
(`grid ← world ← agents/pathfinding/tilemap ← React packages`). No upward
imports, no cycles.

**Why:** each package is understandable and testable alone; consumers pay
only for what they use; Nx caches and parallelizes per package.

**Tradeoff:** more package boilerplate. Copy an existing package rather
than inventing a third flavor — conventions are in
[AGENTS.md](../AGENTS.md).

## 8. Source-first consumption via `@org/source`

**Decision:** every package's exports map has an `@org/source` condition
pointing at `src/`, so in-repo consumers (web app, Storybook, vitest) skip
builds entirely; `dist/` exists for external publishing of the headless
packages.

**Why:** no watch-mode build chains during development; jump-to-definition
lands in source.

**Tradeoff:** two gotchas that will bite you (details in
[AGENTS.md](../AGENTS.md)): Vite 6+ `resolve.conditions` replaces the
defaults, so spread `defaultClientConditions`/`defaultServerConditions`
back in; and composite typecheck must emit declarations to `out-tsc/`,
never `dist/`, or `tsdown --clean` wipes them and downstream typechecks
fail with TS6305.

## Retired: the pre-pivot action/event system

Earlier drafts of this project (an open-source "grid world toolkit")
designed a simulation engine with dispatched actions as the control
boundary, typed event streams, and validation at dispatch. Those packages
(`core`, `actions`, `movement`, `simulation`, `bundle`, …) were never
built; the pivot to the agent-village task app made the village director
(`useVillageSimulation`) the only "engine" needed so far.

The underlying idea — external agents *propose* structured actions and a
validator applies them — is still sound and likely returns when AI agents
start acting on real task data. Design it against the current packages
when that day comes; don't resurrect the old spec.
