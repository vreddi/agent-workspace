import { describe, expect, it } from 'vitest';
import {
  createGrid,
  getNeighbors,
  getVerticalNeighbors,
  gridToWorld,
  isInsideGrid,
  positionsEqual,
  worldToGrid,
} from './grid.js';

describe('createGrid', () => {
  it('returns a valid config for sane inputs', () => {
    const grid = createGrid({ width: 10, height: 5, layers: 2, cellSize: 32 });
    expect(grid).toEqual({ width: 10, height: 5, layers: 2, cellSize: 32 });
  });

  it('defaults to a single layer when layers=1', () => {
    const grid = createGrid({ width: 4, height: 4, layers: 1, cellSize: 1 });
    expect(grid.layers).toBe(1);
  });

  it.each([
    { width: 0, height: 1, layers: 1, cellSize: 1 },
    { width: 1.5, height: 1, layers: 1, cellSize: 1 },
    { width: 1, height: -3, layers: 1, cellSize: 1 },
    { width: 1, height: 1, layers: 0, cellSize: 1 },
    { width: 1, height: 1, layers: 1.5, cellSize: 1 },
    { width: 1, height: 1, layers: 1, cellSize: 0 },
    { width: 1, height: 1, layers: 1, cellSize: Number.POSITIVE_INFINITY },
  ])('rejects invalid input %o', (config) => {
    expect(() => createGrid(config)).toThrow();
  });
});

describe('isInsideGrid', () => {
  const grid = createGrid({ width: 4, height: 3, layers: 2, cellSize: 16 });

  it.each([
    [{ x: 0, y: 0, z: 0 }, true],
    [{ x: 3, y: 2, z: 1 }, true],
    [{ x: 4, y: 0, z: 0 }, false],
    [{ x: 0, y: 3, z: 0 }, false],
    [{ x: -1, y: 0, z: 0 }, false],
    [{ x: 1.5, y: 0, z: 0 }, false],
    [{ x: 0, y: 0, z: -1 }, false],
    [{ x: 0, y: 0, z: 2 }, false],
    [{ x: 0, y: 0, z: 0.5 }, false],
  ] as const)('isInsideGrid(%o) === %s', (pos, expected) => {
    expect(isInsideGrid(grid, pos)).toBe(expected);
  });
});

describe('positionsEqual', () => {
  it('compares by value across all three axes', () => {
    expect(positionsEqual({ x: 1, y: 2, z: 0 }, { x: 1, y: 2, z: 0 })).toBe(true);
    expect(positionsEqual({ x: 1, y: 2, z: 0 }, { x: 2, y: 1, z: 0 })).toBe(false);
    expect(positionsEqual({ x: 1, y: 2, z: 0 }, { x: 1, y: 2, z: 1 })).toBe(false);
  });
});

describe('getNeighbors', () => {
  const grid = createGrid({ width: 3, height: 3, layers: 2, cellSize: 1 });

  it('returns four horizontal neighbors at the same z for an interior cell', () => {
    const neighbors = getNeighbors(grid, { x: 1, y: 1, z: 1 });
    expect(neighbors).toEqual([
      { x: 1, y: 0, z: 1 },
      { x: 2, y: 1, z: 1 },
      { x: 1, y: 2, z: 1 },
      { x: 0, y: 1, z: 1 },
    ]);
  });

  it('does not return vertical neighbors', () => {
    const neighbors = getNeighbors(grid, { x: 1, y: 1, z: 0 });
    for (const n of neighbors) {
      expect(n.z).toBe(0);
    }
  });

  it('clips at corners', () => {
    expect(getNeighbors(grid, { x: 0, y: 0, z: 0 })).toEqual([
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ]);
  });
});

describe('getVerticalNeighbors', () => {
  const grid = createGrid({ width: 3, height: 3, layers: 3, cellSize: 1 });

  it('returns both z-1 and z+1 for an interior layer', () => {
    expect(getVerticalNeighbors(grid, { x: 1, y: 1, z: 1 })).toEqual([
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 1, z: 2 },
    ]);
  });

  it('clips at the bottom layer', () => {
    expect(getVerticalNeighbors(grid, { x: 0, y: 0, z: 0 })).toEqual([
      { x: 0, y: 0, z: 1 },
    ]);
  });

  it('clips at the top layer', () => {
    expect(getVerticalNeighbors(grid, { x: 0, y: 0, z: 2 })).toEqual([
      { x: 0, y: 0, z: 1 },
    ]);
  });
});

describe('gridToWorld / worldToGrid', () => {
  const grid = createGrid({ width: 10, height: 10, layers: 4, cellSize: 32 });

  it('converts grid to world at cell origin', () => {
    expect(gridToWorld(grid, { x: 2, y: 3, z: 1 })).toEqual({
      x: 64,
      y: 96,
      z: 32,
    });
  });

  it('converts world point inside a cell back to its grid cell', () => {
    expect(worldToGrid(grid, { x: 70, y: 100, z: 40 })).toEqual({
      x: 2,
      y: 3,
      z: 1,
    });
  });

  it('round-trips integer grid positions', () => {
    const pos = { x: 5, y: 7, z: 2 };
    expect(worldToGrid(grid, gridToWorld(grid, pos))).toEqual(pos);
  });
});
