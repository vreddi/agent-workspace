import { createGrid } from '@worldkit/grid';
import type { GridPosition } from '@worldkit/grid';
import { addObject, createWorld, setTerrain } from '@worldkit/world';
import type { World } from '@worldkit/world';
import { describe, expect, it } from 'vitest';
import {
  findPath,
  manhattanDistance,
  pathCost,
} from './pathfinding.js';

const makeWorld = (width = 5, height = 5): World =>
  createWorld({
    id: 'test',
    grid: createGrid({ width, height, cellSize: 1 }),
  });

const block = (world: World, position: GridPosition, id?: string): World =>
  addObject(world, {
    id: id ?? `wall_${position.x}_${position.y}`,
    type: 'wall',
    position,
    blocksMovement: true,
  });

describe('manhattanDistance', () => {
  it('measures L1 distance between two cells', () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
    expect(manhattanDistance({ x: 2, y: 2 }, { x: 2, y: 2 })).toBe(0);
    expect(manhattanDistance({ x: -1, y: 0 }, { x: 1, y: 0 })).toBe(2);
  });
});

describe('findPath', () => {
  it('returns a straight path across an empty world', () => {
    const path = findPath(makeWorld(), { x: 0, y: 0 }, { x: 3, y: 0 });
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
  });

  it('returns a single-cell path when start equals goal', () => {
    const path = findPath(makeWorld(), { x: 2, y: 2 }, { x: 2, y: 2 });
    expect(path).toEqual([{ x: 2, y: 2 }]);
  });

  it('routes around a blocking object', () => {
    let world = makeWorld();
    world = block(world, { x: 1, y: 0 });
    const path = findPath(world, { x: 0, y: 0 }, { x: 2, y: 0 });
    expect(path).toBeDefined();
    expect(path![0]).toEqual({ x: 0, y: 0 });
    expect(path![path!.length - 1]).toEqual({ x: 2, y: 0 });
    expect(path!.length).toBe(5);
    for (const step of path!) {
      expect(step).not.toEqual({ x: 1, y: 0 });
    }
  });

  it('routes around blocking terrain', () => {
    let world = makeWorld();
    world = setTerrain(world, {
      position: { x: 1, y: 0 },
      terrain: 'water',
      blocksMovement: true,
    });
    const path = findPath(world, { x: 0, y: 0 }, { x: 2, y: 0 });
    expect(path).toBeDefined();
    expect(path!.length).toBe(5);
  });

  it('returns undefined when the goal is walled off', () => {
    let world = makeWorld();
    // Wall the entire column x=2.
    for (let y = 0; y < 5; y++) {
      world = block(world, { x: 2, y });
    }
    expect(findPath(world, { x: 0, y: 0 }, { x: 4, y: 0 })).toBeUndefined();
  });

  it('returns undefined when the goal cell is itself blocked', () => {
    const world = block(makeWorld(), { x: 2, y: 2 });
    expect(findPath(world, { x: 0, y: 0 }, { x: 2, y: 2 })).toBeUndefined();
  });

  it('returns undefined when start is out of bounds', () => {
    expect(
      findPath(makeWorld(), { x: -1, y: 0 }, { x: 0, y: 0 }),
    ).toBeUndefined();
  });

  it('returns undefined when goal is out of bounds', () => {
    expect(
      findPath(makeWorld(), { x: 0, y: 0 }, { x: 5, y: 0 }),
    ).toBeUndefined();
  });

  it('returns undefined when start position is non-integer', () => {
    expect(
      findPath(makeWorld(), { x: 0.5, y: 0 }, { x: 2, y: 0 }),
    ).toBeUndefined();
  });

  it('respects a custom cost function that marks a cell impassable', () => {
    const path = findPath(
      makeWorld(),
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      {
        cost: (p) =>
          p.x === 1 && p.y === 0 ? Number.POSITIVE_INFINITY : 1,
      },
    );
    expect(path).toBeDefined();
    expect(path!.length).toBe(5);
    for (const step of path!) {
      expect(step).not.toEqual({ x: 1, y: 0 });
    }
  });

  it('respects a custom cost function that steers around expensive cells', () => {
    // Cheap path along y=1, expensive direct path along y=0.
    const path = findPath(
      makeWorld(10, 3),
      { x: 0, y: 1 },
      { x: 4, y: 1 },
      {
        cost: (p) => (p.y === 1 && p.x > 0 && p.x < 4 ? 100 : 1),
      },
    );
    expect(path).toBeDefined();
    for (let i = 1; i < path!.length - 1; i++) {
      expect(path![i]!.y).not.toBe(1);
    }
  });

  it('does not produce a path through a cell with cost <= 0', () => {
    const path = findPath(
      makeWorld(),
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      {
        cost: (p) => (p.x === 1 && p.y === 0 ? 0 : 1),
      },
    );
    expect(path).toBeDefined();
    for (const step of path!) {
      expect(step).not.toEqual({ x: 1, y: 0 });
    }
  });

  it('returns undefined when maxNodes is too small to reach the goal', () => {
    expect(
      findPath(makeWorld(20, 20), { x: 0, y: 0 }, { x: 19, y: 19 }, {
        maxNodes: 1,
      }),
    ).toBeUndefined();
  });

  it('returns the optimal path length on uniform cost', () => {
    const path = findPath(makeWorld(10, 10), { x: 1, y: 1 }, { x: 7, y: 5 });
    expect(path).toBeDefined();
    expect(path!.length).toBe(manhattanDistance(
      { x: 1, y: 1 },
      { x: 7, y: 5 },
    ) + 1);
  });

  it('produces a path of cells that are each 4-way adjacent', () => {
    let world = makeWorld(6, 6);
    world = block(world, { x: 2, y: 2 });
    world = block(world, { x: 2, y: 3 });
    const path = findPath(world, { x: 0, y: 0 }, { x: 4, y: 4 })!;
    expect(path).toBeDefined();
    for (let i = 1; i < path.length; i++) {
      const dx = Math.abs(path[i]!.x - path[i - 1]!.x);
      const dy = Math.abs(path[i]!.y - path[i - 1]!.y);
      expect(dx + dy).toBe(1);
    }
  });
});

describe('pathCost', () => {
  it('returns 0 for an empty path', () => {
    expect(pathCost([])).toBe(0);
  });

  it('returns 0 for a single-cell path', () => {
    expect(pathCost([{ x: 0, y: 0 }])).toBe(0);
  });

  it('sums entry cost for each step after the start using the default cost', () => {
    expect(
      pathCost([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ]),
    ).toBe(2);
  });

  it('uses a custom cost function when provided', () => {
    expect(
      pathCost(
        [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
        ],
        (p) => p.x,
      ),
    ).toBe(3);
  });
});
