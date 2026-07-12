# @worldkit/pathfinding

Headless A\* pathfinding over a `@worldkit/world`. The fourth brick: given a
start, a goal, and the world's occupancy, return the shortest 4-way path
between them — or `undefined` if there isn't one.

This package answers the boring, sacred questions:

- Is there a path from A to B in this world?
- What is the shortest 4-way path?
- Which path is cheapest given a custom movement cost?

## Install

```bash
pnpm add @worldkit/pathfinding @worldkit/world @worldkit/grid
```

## Usage

```ts
import { createGrid } from '@worldkit/grid'
import { addObject, createWorld } from '@worldkit/world'
import { findPath } from '@worldkit/pathfinding'

let world = createWorld({
  id: 'demo',
  grid: createGrid({ width: 10, height: 10, cellSize: 32 }),
})

world = addObject(world, {
  id: 'tree_1',
  type: 'tree',
  position: { x: 1, y: 0 },
  blocksMovement: true,
})

findPath(world, { x: 0, y: 0 }, { x: 2, y: 0 })
// [{x:0,y:0}, {x:0,y:1}, {x:1,y:1}, {x:2,y:1}, {x:2,y:0}]

findPath(world, { x: 0, y: 0 }, { x: 9, y: 9 })
// [...full path]
```

## API

### Types

```ts
type Path = GridPosition[]

type CostFn = (position: GridPosition) => number

type FindPathOptions = {
  cost?: CostFn // entry cost per cell; default 1
  maxNodes?: number // safety brake; default 10_000
}
```

### `findPath(world, start, goal, options?)`

Returns a `Path` from `start` to `goal` (inclusive) along walkable 4-way
neighbors, or `undefined` when no path exists. The path always includes both
endpoints; when `start` equals `goal`, the result is `[start]`.

Cells are walkable when `isCellBlocked(world, cell)` is `false` **and** the
custom `cost(cell)` is a positive finite number. Any non-finite or
non-positive cost is treated as impassable.

Out-of-bounds `start` or `goal`, or a blocked `goal`, yields `undefined`.

### `manhattanDistance(a, b)`

L1 distance — the heuristic A\* uses internally. Exposed because it's handy
upstream (range checks, sorting candidates, deciding whether to pathfind at
all).

### `pathCost(path, cost?)`

Sums the entry cost of every step after the first. The starting cell is
free — you're already there.

## Design notes

- **4-way only.** Mirrors `getNeighbors` from `@worldkit/grid`. Diagonals are
  a movement rule; if you need them, build that on top.
- **A\* with a binary min-heap.** Manhattan heuristic. Admissible when all
  step costs are `≥ 1`. If you use sub-unit costs, A* may no longer return
  the optimal path — it will still return *a\* path.
- **Custom cost is a function, not data on the world.** Keeps `@worldkit/world`
  free of pathfinding concerns and lets callers compute cost from terrain
  type, agent traits, time of day, whatever.
- **`maxNodes` safety brake.** Pathological worlds (giant + maze-like) can
  blow up; the brake returns `undefined` instead of hanging. Tune per-call.
- **Plain data in, plain data out.** No classes, no internal state. Each call
  is independent and serializable inputs produce serializable outputs.
