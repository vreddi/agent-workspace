# @worldkit/world

Headless world state. The second brick: terrain, objects, and occupancy on top
of `@worldkit/grid`. No rendering, no agents, no AI — just a sturdy, serializable
record of what exists where.

This package answers the boring, sacred questions:

- What is this world?
- What grid does it use?
- What terrain exists at this cell?
- What objects exist? Where?
- Is this cell blocked?
- Can this world be saved and loaded?

## Install

```bash
pnpm add @worldkit/world @worldkit/grid
```

## Usage

```ts
import { createGrid } from '@worldkit/grid';
import {
  addObject,
  createWorld,
  isCellBlocked,
  setTerrain,
} from '@worldkit/world';

let world = createWorld({
  id: 'demo',
  grid: createGrid({ width: 20, height: 20, cellSize: 32 }),
});

world = setTerrain(world, {
  position: { x: 2, y: 2 },
  terrain: 'water',
  blocksMovement: true,
});

world = addObject(world, {
  id: 'tree_1',
  type: 'tree',
  position: { x: 5, y: 5 },
  blocksMovement: true,
});

isCellBlocked(world, { x: 2, y: 2 }); // true (blocking terrain)
isCellBlocked(world, { x: 5, y: 5 }); // true (blocking object)
isCellBlocked(world, { x: 1, y: 1 }); // false
isCellBlocked(world, { x: -1, y: 0 }); // true (out of bounds)
```

## Immutability

All functions return a new `World` instead of mutating in place. That makes
undo/redo, replay, sync, and AI validation straightforward.

```ts
const nextWorld = addObject(world, tree);
```

## API

### Types

```ts
type WorldId = string;
type EntityId = string;
type TerrainId = string;
type ObjectType = string;

type TerrainCell = {
  position: GridPosition;
  terrain: TerrainId;
  blocksMovement?: boolean;
};

type WorldObject = {
  id: EntityId;
  type: ObjectType;
  position: GridPosition;
  blocksMovement?: boolean;
  tags?: string[];
  data?: Record<string, unknown>;
};

type World = {
  id: WorldId;
  name?: string;
  grid: GridConfig;
  terrain: Record<string, TerrainCell>;
  objects: Record<EntityId, WorldObject>;
};
```

### `getCellKey(position)`

Returns a stable string key for a `GridPosition` (`"x,y"`). Used internally for
the terrain map; exposed because the same key shows up in occupancy lookups,
editor selection, multiplayer patches, and pathfinding.

### `createWorld({ id, name?, grid })`

Returns a new empty `World`. Validates the grid via `createGrid`. Throws on an
empty `id`.

### `setTerrain(world, cell)`

Sets terrain at a cell. Throws if the position is outside the grid.

### `getTerrain(world, position)`

Returns the `TerrainCell` at `position`, or `undefined`.

### `removeTerrain(world, position)`

Removes terrain at a cell. No-op when there is no terrain.

### `addObject(world, object)`

Adds an object to the world. Throws on empty id, duplicate id, or out-of-bounds
position.

### `removeObject(world, objectId)`

Removes an object by id. No-op for unknown ids.

### `getObject(world, objectId)`

Returns the object with `objectId`, or `undefined`.

### `getObjectsAt(world, position)`

Returns every object whose position matches `position`. Multiple objects per
cell are allowed.

### `isCellBlocked(world, position)`

`true` if the cell is out of bounds, has blocking terrain, or contains a
blocking object. Out-of-bounds counts as blocked — makes pathfinding safer.

## Design notes

- **No spatial index yet.** `getObjectsAt` is a linear scan. Correct first, fast
  later — once a real workload demands it.
- **Plain data.** `World` is a serializable object. `JSON.stringify` /
  `JSON.parse` round-trips cleanly.
- **No agents here.** Agents land in `@worldkit/agents`; the world will store
  them as entities later, in `@worldkit/simulation`.
