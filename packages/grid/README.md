# @worldkit/grid

Headless grid coordinate system. The compass for everything above it: world
state, agents, pathfinding, rendering. Zero runtime dependencies.

This package answers the boring, sacred questions:

- Is this cell inside the world?
- What are this cell's neighbors?
- Are these two positions equal?
- How do I convert a grid position to a world (pixel) position?
- How do I convert a world point back to a grid cell?

## Install

```bash
pnpm add @worldkit/grid
```

## Usage

```ts
import {
  createGrid,
  isInsideGrid,
  getNeighbors,
  gridToWorld,
  worldToGrid,
} from '@worldkit/grid'

const grid = createGrid({ width: 20, height: 20, cellSize: 32 })

isInsideGrid(grid, { x: 5, y: 5 }) // true
isInsideGrid(grid, { x: 20, y: 0 }) // false

getNeighbors(grid, { x: 0, y: 0 })
// [{ x: 1, y: 0 }, { x: 0, y: 1 }]

gridToWorld(grid, { x: 3, y: 2 }) // { x: 96, y: 64 }
worldToGrid(grid, { x: 100, y: 70 }) // { x: 3, y: 2 }
```

## API

### `GridPosition`

```ts
type GridPosition = { x: number; y: number }
```

Integer cell coordinates. Origin `(0, 0)` is the top-left cell.

### `GridConfig`

```ts
type GridConfig = { width: number; height: number; cellSize: number }
```

`width` / `height` are cell counts. `cellSize` is the pixel size of a cell.

### `createGrid(config)`

Validates and returns a `GridConfig`. Throws for non-positive integer
dimensions or non-positive / non-finite `cellSize`.

### `isInsideGrid(grid, position)`

`true` iff `position` is an integer cell inside the grid bounds.

### `positionsEqual(a, b)`

Value equality for `GridPosition`.

### `getNeighbors(grid, position)`

Returns the 4-way (N/E/S/W) neighbors of `position` that are inside the grid.

### `gridToWorld(grid, position)`

Converts a grid cell to its world-space origin point.

### `worldToGrid(grid, point)`

Converts a world point back to the grid cell that contains it.
