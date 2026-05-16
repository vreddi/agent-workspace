import {
  getNeighbors,
  isInsideGrid,
  positionsEqual,
} from '@worldkit/grid';
import type { GridPosition } from '@worldkit/grid';
import { isCellBlocked } from '@worldkit/world';
import type { World } from '@worldkit/world';
import { createHeap, heapPop, heapPush, heapSize } from './heap.js';
import type { CostFn, FindPathOptions, Path } from './types.js';

type OpenNode = {
  position: GridPosition;
  f: number;
};

const DEFAULT_MAX_NODES = 10_000;
const DEFAULT_COST: CostFn = () => 1;

function key(position: GridPosition): string {
  return `${position.x},${position.y}`;
}

export function manhattanDistance(
  a: GridPosition,
  b: GridPosition,
): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
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
    return [{ x: start.x, y: start.y }];
  }
  if (isCellBlocked(world, goal)) {
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

    for (const neighbor of getNeighbors(world.grid, current.position)) {
      if (isCellBlocked(world, neighbor)) {
        continue;
      }
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
  const path: Path = [{ x: end.x, y: end.y }];
  let k = key(end);
  while (cameFrom.has(k)) {
    const prev = cameFrom.get(k)!;
    path.push({ x: prev.x, y: prev.y });
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
