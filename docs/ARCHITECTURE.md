# Architecture: Package Structure and Data Flow

## Layered Architecture

```
┌─────────────────────────────────────────┐
│   UI/Editor Integrations                │
│   (React, Editor Tools, Web Apps)       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Rendering Adapters                    │
│   (PixiJS, Canvas, Three.js, DOM)       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Simulation Engine & Rules             │
│   (Action dispatch, tick, events)       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   World State (Logical + Agents)        │
│   (Positions, entities, terrain)        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Grid & Pathfinding                    │
│   (Coordinates, A*, collision)          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Core Types & Utilities                │
│   (EntityId, Position, events)          │
└─────────────────────────────────────────┘
```

## 2.5D Model

The world is logically a stack of grid layers along the `z` axis, rendered with
an isometric (or oblique) projection so it reads as 2.5D. Internally the sim
stays grid-discrete and testable; the renderer is the only part that draws
depth.

### Logical model (sim-side)

- `GridPosition = { x, y, z }` and `GridConfig = { width, height, layers, cellSize }`.
- Cells are addressed by `(x, y, z)`. Terrain at `(x, y, z=0)` and terrain at
  `(x, y, z=1)` are independent tiles.
- A cell is **standable** iff it has non-blocking terrain AND no blocking
  object. **Empty = air**: a cell with no terrain is not enterable. This is the
  key semantic shift from a flat 2D grid — every walkable cell needs an
  explicit floor tile underneath.
- Horizontal neighbors stay on the same `z`. There is no free vertical
  adjacency; agents only change layers via **ramp** tiles.

### Ramps

A terrain tile may carry `ramp: { up: Direction }` to act as a one-cell slope.
If a ramp at `(x, y, z)` has `up: 'east'`, then:

- Standing on it, stepping east lands you at `(x+1, y, z+1)`.
- Standing at `(x+1, y, z+1)`, stepping west brings you back onto the ramp at
  `(x, y, z)`.

The pathfinder handles both directions automatically — no `move.up` action
needed. Both endpoints must be standable; ramps don't synthesize floors.

### Out of scope (for now)

- **No gravity.** An agent at `(x, y, 3)` with no floor below does not fall.
- **No tall agents.** Agents occupy exactly one `(x, y, z)` cell.
- **No diagonal ramps.** Slopes face N/E/S/W only.

### Isometric rendering (forward-looking)

No renderer exists yet, but the logical model is built for an iso projection.
When the `renderer-pixi` (or similar) package is added, it should use:

```
screenX = (gridX - gridY) * (tileW / 2)
screenY = (gridX + gridY) * (tileH / 2) - z * tileH * heightRatio
```

- `heightRatio` controls how visually tall a single layer is (commonly 0.5–1).
- **Draw order:** ascending `(x + y + z)` so nearer/higher tiles overlay farther/lower ones.
- **Mouse picking:** apply the inverse iso transform, then hit-test layers
  top-down (`z = layers - 1` downwards) so a click on a rooftop selects the
  rooftop tile, not the floor beneath it.
- **Visual freeform:** ramp tiles render as smooth slopes; objects can carry
  per-tile pixel offsets and rotation. The grid logic doesn't care — it only
  sees discrete `(x, y, z)`.

This is a *rendering* concern only; nothing in `grid`/`world`/`pathfinding`/
`agents` knows about the projection.

---

## Package Responsibilities

### Tier 1: Core Primitives

#### `@worldkit/core`
**Purpose:** Foundational types, no logic, zero dependencies.

**Exports:**
- `EntityId` — Unique identifier type
- `GridPosition` — Grid cell coordinate `{ x: number; y: number; z: number }` (z = layer index for 2.5D)
- `Direction` — Cardinal directions (N, S, E, W, NE, NW, SE, SW)
- `Size` — Dimensions `{ width: number; height: number }`
- `Result<T, E>` — Error handling type
- Event types and emitter interfaces
- Schemas and serialization helpers

**Philosophy:** No decisions here, just type definitions and constants.

---

### Tier 2: Grid & Spatial Logic

#### `@worldkit/grid`
**Purpose:** Grid coordinate system, bounds, neighbors, occupancy.

**Exports:**
- `GridConfig` — Grid dimensions and metadata
- `GridSystem` — Helper class for bounds checks, neighbor lookup
- `occupancy.ts` — Occupancy map and helpers
- `coordinates.ts` — Coordinate conversion functions
- `neighbors.ts` — Get adjacent cells (4-way, 8-way, custom)
- `bounds.ts` — Bounds checking and clipping

**Usage:**
```ts
const grid = createGrid({ width: 20, height: 20, layers: 2, cellSize: 32 });
const neighbors = getNeighbors(grid, { x: 5, y: 5, z: 0 });          // 4 horizontal
const upDown   = getVerticalNeighbors(grid, { x: 5, y: 5, z: 0 });   // [z+1]
const isValid  = isInsideGrid(grid, { x: -1, y: 5, z: 0 });          // false
```

**Dependencies:** `@worldkit/core` only.

---

### Tier 3: World State Model

#### `@worldkit/world`
**Purpose:** World data structure, entities, terrain, serialization.

**Exports:**
- `World` — Main world state object
- `WorldEntity` — Generic entity (object, decoration)
- `TerrainCell` — Terrain type and metadata
- `createWorld()` — Constructor
- `WorldSerializer` — JSON save/load
- Update helpers (immutable-friendly)

**Structure:**
```ts
type World = {
  id: string;
  name?: string;
  grid: GridConfig;
  terrain: TerrainCell[];        // Indexed by grid position
  entities: Record<EntityId, WorldEntity>;
  agents: Record<EntityId, Agent>;
  // ... metadata, version, etc.
};
```

**Philosophy:** World state is plain data, not an opaque class.

**Dependencies:** `@worldkit/core`, `@worldkit/grid`.

---

### Tier 4: Agents & Characters

#### `@worldkit/agents`
**Purpose:** Agent definition, state, and lifecycle.

**Exports:**
- `Agent` — Agent type with position, name, state
- `AgentState` — Enum (idle, moving, acting, waiting, dead)
- `createAgent()` — Factory
- Agent memory/traits placeholder for future expansion

**Structure:**
```ts
type Agent = {
  id: EntityId;
  name: string;
  position: GridPosition;
  facing?: Direction;
  state: AgentState;
  traits?: Record<string, unknown>;
  memory?: Record<string, unknown>;
};
```

**Philosophy:** Lightweight, supports extensions (traits, memory) without forcing them.

**Dependencies:** `@worldkit/core`, `@worldkit/world`.

---

### Tier 5: Actions & Control

#### `@worldkit/actions`
**Purpose:** Structured action types, validation, and registry.

**Exports:**
- `WorldAction` — Discriminated union of all action types
- Action types:
  - `move.to` — Move agent to target cell
  - `move.step` — Move agent one cell in direction
  - `agent.say` — Agent speaks text
  - `agent.wait` — Agent pauses for N ticks
  - `object.use` — Interact with object
  - `object.pickup` — Pick up object
  - `object.drop` — Drop object
  - `world.placeObject` — Add object to world
  - `world.removeObject` — Remove object from world
- `ActionRegistry` — Register custom actions
- `ActionValidator` — Check action preconditions

**Structure:**
```ts
type WorldAction =
  | { type: "move.to"; actorId: EntityId; target: GridPosition }
  | { type: "move.step"; actorId: EntityId; direction: Direction }
  | { type: "agent.say"; actorId: EntityId; text: string }
  | { type: "agent.wait"; actorId: EntityId; ticks: number }
  // ... more actions
```

**Philosophy:** Actions are plain JSON, serializable, and safe for AI use.

**Dependencies:** `@worldkit/core`, `@worldkit/world`.

---

### Tier 6: Movement & Pathfinding

#### `@worldkit/pathfinding`
**Purpose:** A* pathfinding and movement planning.

**Exports:**
- `findPath(from, to, world, options)` — A* search
- `PathfindingOptions` — Heuristic, max distance, diagonal movement
- `PathfindingResult` — Path or failure reason
- Movement cost and walkability callbacks

**Usage:**
```ts
const path = findPath(
  { x: 2, y: 2 },
  { x: 10, y: 8 },
  world,
  { allowDiagonal: true, maxDistance: 50 }
);

if (path.ok) {
  // path.value is GridPosition[]
} else {
  // path.error is failure reason
}
```

**Dependencies:** `@worldkit/core`, `@worldkit/world`, `@worldkit/grid`.

---

#### `@worldkit/movement`
**Purpose:** Movement rules, collision, reservation.

**Exports:**
- `canMoveTo()` — Check if cell is walkable
- `getMovementCost()` — Cost to move into cell
- `reserveCell()` — Reserve a cell (for collision avoidance)
- Movement constraint checks

**Philosophy:** Answers "can the agent move?" without animation or rendering.

**Dependencies:** `@worldkit/core`, `@worldkit/world`, `@worldkit/grid`.

---

### Tier 7: Simulation Engine

#### `@worldkit/simulation`
**Purpose:** Action dispatch, tick loop, event emission, rule application.

**Exports:**
- `Simulation` — Main simulation class
- `createSimulation(world)` — Constructor
- `dispatch(action)` — Queue action
- `tick(dt)` — Advance by delta time
- `hasPendingWork()` — Check if simulation has active tasks
- `on(event, handler)` — Listen to events

**Structure:**
```ts
const sim = createSimulation(world);

sim.on("agent.moved", (e) => {
  console.log(`${e.agentId} moved from ${e.from} to ${e.to}`);
});

sim.dispatch({ type: "move.to", actorId: "agent_1", target: { x: 10, y: 8 } });

while (sim.hasPendingWork()) {
  sim.tick(16);  // 16ms step
}
```

**Event Types:**
```ts
type WorldEvent =
  | { type: "agent.moved"; agentId: EntityId; from: GridPosition; to: GridPosition }
  | { type: "action.started"; action: WorldAction }
  | { type: "action.completed"; action: WorldAction }
  | { type: "action.failed"; action: WorldAction; reason: string }
  | { type: "agent.speaking"; agentId: EntityId; text: string }
  | { type: "object.placed"; objectId: EntityId; position: GridPosition }
  | { type: "object.removed"; objectId: EntityId }
  // ... more events
```

**Philosophy:** Simulation is deterministic, testable, and independent of rendering.

**Dependencies:** All core packages.

---

### Tier 8: Assets (Optional)

#### `@worldkit/assets`
**Purpose:** Asset definitions, visual metadata, reusable packs.

**Exports:**
- `AssetDefinition` — Base interface
- `CharacterDefinition` — Agent visual and behavior metadata
- `ObjectDefinition` — World object with size, tags, visual data
- `TerrainDefinition` — Terrain visual and properties
- `AssetRegistry` — Lookup and enumeration

**Philosophy:** Assets are metadata, not graphics. Rendering adapters use asset definitions to decide how to draw.

**Dependencies:** `@worldkit/core`.

---

## Optional Layer: Rendering (Not Tier 1)

### `@worldkit/renderer`
**Purpose:** Renderer-agnostic interface.

```ts
interface WorldRenderer {
  mount(target: HTMLElement): void;
  unmount(): void;
  render(world: World): void;
  setCamera(camera: CameraState): void;
  on(event: string, handler: Function): void;
}
```

### `@worldkit/renderer-pixi`
**Purpose:** PixiJS implementation.

- Sprite management
- Layer structure (terrain, objects, agents, overlay)
- Camera pan/zoom
- Hit testing and picking
- Smooth animation interpolation

**Philosophy:** Swappable. Another adapter can use Canvas, Three.js, or DOM.

---

## Optional Layer: React Integration

### `@worldkit/react`
**Purpose:** React hooks and context.

```ts
<WorldProvider world={world} simulation={simulation}>
  <WorldCanvas renderer="pixi" />
</WorldProvider>

const { world, simulation } = useWorld();
const agents = useAgents();
```

**Philosophy:** Thin wrapper around core packages. No simulation logic here.

---

## Optional Layer: Editor & AI

### `@worldkit/editor`
- Selection, placement, brush tools
- Undo/redo
- Snap-to-grid helpers

### `@worldkit/ai`
- Action schema generation
- Observation building
- Action filtering and validation
- Safe parsing of model output

---

## Bundle Package

### `@worldkit/bundle`
**Purpose:** Re-export common APIs for convenience.

```ts
// Instead of:
import { createWorld } from "@worldkit/world";
import { createSimulation } from "@worldkit/simulation";
import { findPath } from "@worldkit/pathfinding";

// You can write:
import { createWorld, createSimulation, findPath } from "@worldkit/bundle";
```

---

## Data Flow Example

### Scenario: Agent moves to a target

```
1. User calls: sim.dispatch({ type: "move.to", actorId: "agent_1", target: { x: 10, y: 8 } })

2. Simulation validates:
   - Does agent_1 exist?
   - Is (10, 8) in bounds?
   - Is (10, 8) walkable?

3. Pathfinding finds route:
   - findPath() returns GridPosition[]

4. Simulation queues movement ticks:
   - One tick per grid cell

5. Each tick:
   - Move agent one step toward target
   - Emit "agent.moved" event
   - Check if reached target
   - If stuck, emit "action.failed" event

6. Renderer listens to events:
   - Animates agent sprite
   - Updates camera
   - Redraws layers

7. AI/UI responds:
   - Listens to "action.completed" event
   - Observes new state
   - Decides next action
```

---

## Dependency Graph (Simplified)

```
renderer-pixi
renderer          ← simulation, world, core
react
editor            ← world, actions, grid
ai                ← world, actions

simulation        ← pathfinding, movement, actions, world, agents, grid, core
pathfinding       ← movement, grid, world, core
movement          ← grid, world, core
actions           ← world, core
agents            ← world, core
world             ← grid, core
grid              ← core
core              ← (nothing)

bundle            ← re-exports all
```

**Rule:** Packages only import from lower tiers. No upward imports or circular dependencies.

---

## Key Design Decisions

1. **Plain Data > Classes** — World state is serializable, not encapsulated
2. **Actions as Control Boundary** — Simulation validates, not the caller
3. **No Rendering in Core** — Simulation runs headless
4. **Events, Not Callbacks** — Decoupled feedback
5. **Small, Focused Packages** — Easy to understand and test
6. **Explicit > Implicit** — No magic configuration or auto-wiring

See [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) for more detail.
