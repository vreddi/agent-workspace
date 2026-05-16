import {
  directionToDelta,
  isInsideGrid,
  positionsEqual,
} from '@worldkit/grid';
import type { Direction, GridPosition } from '@worldkit/grid';
import { getTerrain, isCellStandable } from '@worldkit/world';
import type { World } from '@worldkit/world';
import { createHeap, heapPop, heapPush, heapSize } from './heap.js';
import type { CostFn, FindPathOptions, Path } from './types.js';

type OpenNode = {
  position: GridPosition;
  f: number;
};

const DEFAULT_MAX_NODES = 10_000;
const DEFAULT_COST: CostFn = () => 1;

const HORIZONTAL_DIRECTIONS: ReadonlyArray<Direction> = [
  'north',
  'east',
  'south',
  'west',
];

function key(position: GridPosition): string {
  return `${position.x},${position.y},${position.z}`;
}

function opposite(direction: Direction): Direction {
  switch (direction) {
    case 'north':
      return 'south';
    case 'south':
      return 'north';
    case 'east':
      return 'west';
    case 'west':
      return 'east';
  }
}

export function manhattanDistance(
  a: GridPosition,
  b: GridPosition,
): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
}

// Returns every cell reachable from `from` in one A* step.
// Horizontal: any same-z neighbor that is standable.
// Vertical: opt-in via ramps only.
//   - If the current tile is a ramp with up=dir, we may step into
//     (x+dx, y+dy, z+1) when that target is standable.
//   - If stepping in direction dir off the current cell would land on empty
//     air but a ramp exists at (x+dx, y+dy, z-1) whose `up` faces us, we may
//     step down onto that ramp.
function expandNeighbors(
  world: World,
  from: GridPosition,
): GridPosition[] {
  const out: GridPosition[] = [];
  const fromTerrain = getTerrain(world, from);
  const fromRamp = fromTerrain?.ramp;

  for (const dir of HORIZONTAL_DIRECTIONS) {
    const { x: dx, y: dy } = directionToDelta(dir);
    const same: GridPosition = {
      x: from.x + dx,
      y: from.y + dy,
      z: from.z,
    };

    if (isInsideGrid(world.grid, same) && isCellStandable(world, same)) {
      out.push(same);
    }

    if (fromRamp && fromRamp.up === dir) {
      const up: GridPosition = {
        x: from.x + dx,
        y: from.y + dy,
        z: from.z + 1,
      };
      if (isInsideGrid(world.grid, up) && isCellStandable(world, up)) {
        out.push(up);
      }
    }

    const down: GridPosition = {
      x: from.x + dx,
      y: from.y + dy,
      z: from.z - 1,
    };
    if (isInsideGrid(world.grid, down)) {
      const downTerrain = getTerrain(world, down);
      if (
        downTerrain?.ramp?.up === opposite(dir) &&
        isCellStandable(world, down)
      ) {
        out.push(down);
      }
    }
  }

  return out;
}

export function findPath(
  world: World,
  start: GridPosition,
  goal: GridPosition,
  options?: FindPathOptions,
): Path | undefined {
  if (!isInsideGrid(world.grid, start)) {
    return undefined;
  }
  if (!isInsideGrid(world.grid, goal)) {
    return undefined;
  }
  if (positionsEqual(start, goal)) {
    return [{ x: start.x, y: start.y, z: start.z }];
  }
  if (!isCellStandable(world, goal)) {
    return undefined;
  }

  const cost = options?.cost ?? DEFAULT_COST;
  const maxNodes = options?.maxNodes ?? DEFAULT_MAX_NODES;

  const open = createHeap<OpenNode>((a, b) => a.f - b.f);
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, GridPosition>();

  gScore.set(key(start), 0);
  heapPush(open, { position: start, f: manhattanDistance(start, goal) });

  let expanded = 0;
  while (heapSize(open) > 0) {
    if (expanded >= maxNodes) {
      return undefined;
    }
    expanded++;

    const current = heapPop(open)!;
    const currentKey = key(current.position);
    const currentG = gScore.get(currentKey)!;

    // Stale entry: a better path to this node was already found.
    if (current.f - manhattanDistance(current.position, goal) > currentG) {
      continue;
    }

    if (positionsEqual(current.position, goal)) {
      return reconstruct(cameFrom, current.position);
    }

    for (const neighbor of expandNeighbors(world, current.position)) {
      const stepCost = cost(neighbor);
      if (!Number.isFinite(stepCost) || stepCost <= 0) {
        continue;
      }
      const tentative = currentG + stepCost;
      const neighborKey = key(neighbor);
      const existing = gScore.get(neighborKey);
      if (existing !== undefined && tentative >= existing) {
        continue;
      }
      gScore.set(neighborKey, tentative);
      cameFrom.set(neighborKey, current.position);
      heapPush(open, {
        position: neighbor,
        f: tentative + manhattanDistance(neighbor, goal),
      });
    }
  }

  return undefined;
}

function reconstruct(
  cameFrom: Map<string, GridPosition>,
  end: GridPosition,
): Path {
  const path: Path = [{ x: end.x, y: end.y, z: end.z }];
  let k = key(end);
  while (cameFrom.has(k)) {
    const prev = cameFrom.get(k)!;
    path.push({ x: prev.x, y: prev.y, z: prev.z });
    k = key(prev);
  }
  path.reverse();
  return path;
}

export function pathCost(path: Path, cost?: CostFn): number {
  if (path.length <= 1) {
    return 0;
  }
  const costFn = cost ?? DEFAULT_COST;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += costFn(path[i]!);
  }
  return total;
}
