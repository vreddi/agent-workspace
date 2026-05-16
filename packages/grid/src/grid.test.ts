import { describe, expect, it } from 'vitest';
import {
  createGrid,
  getNeighbors,
  gridToWorld,
  isInsideGrid,
  positionsEqual,
  worldToGrid,
} from './grid.js';

describe('createGrid', () => {
  it('returns a valid config for sane inputs', () => {
    const grid = createGrid({ width: 10, height: 5, cellSize: 32 });
    expect(grid).toEqual({ width: 10, height: 5, cellSize: 32 });
  });

  it.each([
    { width: 0, height: 1, cellSize: 1 },
    { width: 1.5, height: 1, cellSize: 1 },
    { width: 1, height: -3, cellSize: 1 },
    { width: 1, height: 1, cellSize: 0 },
    { width: 1, height: 1, cellSize: Number.POSITIVE_INFINITY },
  ])('rejects invalid input %o', (config) => {
    expect(() => createGrid(config)).toThrow();
  });
});

describe('isInsideGrid', () => {
  const grid = createGrid({ width: 4, height: 3, cellSize: 16 });

  it.each([
    [{ x: 0, y: 0 }, true],
    [{ x: 3, y: 2 }, true],
    [{ x: 4, y: 0 }, false],
    [{ x: 0, y: 3 }, false],
    [{ x: -1, y: 0 }, false],
    [{ x: 1.5, y: 0 }, false],
  ] as const)('isInsideGrid(%o) === %s', (pos, expected) => {
    expect(isInsideGrid(grid, pos)).toBe(expected);
  });
});

describe('positionsEqual', () => {
  it('compares by value', () => {
    expect(positionsEqual({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
    expect(positionsEqual({ x: 1, y: 2 }, { x: 2, y: 1 })).toBe(false);
  });
});

describe('getNeighbors', () => {
  const grid = createGrid({ width: 3, height: 3, cellSize: 1 });

  it('returns four neighbors for an interior cell', () => {
    const neighbors = getNeighbors(grid, { x: 1, y: 1 });
    expect(neighbors).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 1 },
    ]);
  });

  it('clips at corners', () => {
    expect(getNeighbors(grid, { x: 0, y: 0 })).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]);
  });
});

describe('gridToWorld / worldToGrid', () => {
  const grid = createGrid({ width: 10, height: 10, cellSize: 32 });

  it('converts grid to world at cell origin', () => {
    expect(gridToWorld(grid, { x: 2, y: 3 })).toEqual({ x: 64, y: 96 });
  });

  it('converts world point inside a cell back to its grid cell', () => {
    expect(worldToGrid(grid, { x: 70, y: 100 })).toEqual({ x: 2, y: 3 });
  });

  it('round-trips integer grid positions', () => {
    const pos = { x: 5, y: 7 };
    expect(worldToGrid(grid, gridToWorld(grid, pos))).toEqual(pos);
  });
});
