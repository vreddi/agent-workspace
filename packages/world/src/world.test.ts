import { createGrid } from '@worldkit/grid';
import { describe, expect, it } from 'vitest';
import {
  addObject,
  createWorld,
  getCellKey,
  getObject,
  getObjectsAt,
  getTerrain,
  isCellBlocked,
  removeObject,
  removeTerrain,
  setTerrain,
} from './world.js';

const makeWorld = () =>
  createWorld({
    id: 'demo',
    grid: createGrid({ width: 10, height: 10, cellSize: 32 }),
  });

describe('getCellKey', () => {
  it('produces a stable key from a position', () => {
    expect(getCellKey({ x: 3, y: 4 })).toBe('3,4');
  });

  it('distinguishes (x,y) from (y,x)', () => {
    expect(getCellKey({ x: 1, y: 2 })).not.toBe(getCellKey({ x: 2, y: 1 }));
  });
});

describe('createWorld', () => {
  it('creates an empty world with grid', () => {
    const world = makeWorld();
    expect(world.id).toBe('demo');
    expect(world.grid).toEqual({ width: 10, height: 10, cellSize: 32 });
    expect(world.terrain).toEqual({});
    expect(world.objects).toEqual({});
  });

  it('accepts an optional name', () => {
    const world = createWorld({
      id: 'demo',
      name: 'Demo World',
      grid: createGrid({ width: 4, height: 4, cellSize: 16 }),
    });
    expect(world.name).toBe('Demo World');
  });

  it('rejects an empty id', () => {
    expect(() =>
      createWorld({
        id: '',
        grid: createGrid({ width: 4, height: 4, cellSize: 16 }),
      }),
    ).toThrow();
  });
});

describe('setTerrain / getTerrain', () => {
  it('sets and reads a terrain cell', () => {
    const world = setTerrain(makeWorld(), {
      position: { x: 3, y: 4 },
      terrain: 'grass',
    });
    expect(getTerrain(world, { x: 3, y: 4 })).toEqual({
      position: { x: 3, y: 4 },
      terrain: 'grass',
    });
  });

  it('returns undefined when no terrain is set', () => {
    expect(getTerrain(makeWorld(), { x: 0, y: 0 })).toBeUndefined();
  });

  it('overwrites existing terrain at the same cell', () => {
    let world = setTerrain(makeWorld(), {
      position: { x: 1, y: 1 },
      terrain: 'grass',
    });
    world = setTerrain(world, {
      position: { x: 1, y: 1 },
      terrain: 'water',
      blocksMovement: true,
    });
    expect(getTerrain(world, { x: 1, y: 1 })).toEqual({
      position: { x: 1, y: 1 },
      terrain: 'water',
      blocksMovement: true,
    });
  });

  it('does not mutate the original world', () => {
    const a = makeWorld();
    const b = setTerrain(a, { position: { x: 0, y: 0 }, terrain: 'grass' });
    expect(a.terrain).toEqual({});
    expect(b).not.toBe(a);
  });

  it('rejects terrain outside the grid', () => {
    expect(() =>
      setTerrain(makeWorld(), {
        position: { x: 10, y: 0 },
        terrain: 'grass',
      }),
    ).toThrow();
  });
});

describe('removeTerrain', () => {
  it('removes terrain at a cell', () => {
    let world = setTerrain(makeWorld(), {
      position: { x: 2, y: 2 },
      terrain: 'grass',
    });
    world = removeTerrain(world, { x: 2, y: 2 });
    expect(getTerrain(world, { x: 2, y: 2 })).toBeUndefined();
  });

  it('is a no-op when no terrain exists at the cell', () => {
    const world = makeWorld();
    expect(removeTerrain(world, { x: 0, y: 0 })).toBe(world);
  });
});

describe('addObject / getObject / removeObject', () => {
  const tree = {
    id: 'tree_1',
    type: 'tree',
    position: { x: 5, y: 5 },
    blocksMovement: true,
  };

  it('adds and reads an object', () => {
    const world = addObject(makeWorld(), tree);
    expect(getObject(world, 'tree_1')).toEqual(tree);
  });

  it('rejects duplicate object ids', () => {
    const world = addObject(makeWorld(), tree);
    expect(() => addObject(world, tree)).toThrow();
  });

  it('rejects an empty object id', () => {
    expect(() =>
      addObject(makeWorld(), { ...tree, id: '' }),
    ).toThrow();
  });

  it('rejects objects placed outside the grid', () => {
    expect(() =>
      addObject(makeWorld(), { ...tree, position: { x: -1, y: 0 } }),
    ).toThrow();
    expect(() =>
      addObject(makeWorld(), { ...tree, position: { x: 10, y: 10 } }),
    ).toThrow();
  });

  it('removes an object by id', () => {
    let world = addObject(makeWorld(), tree);
    world = removeObject(world, 'tree_1');
    expect(getObject(world, 'tree_1')).toBeUndefined();
  });

  it('removeObject is a no-op for unknown ids', () => {
    const world = makeWorld();
    expect(removeObject(world, 'nope')).toBe(world);
  });

  it('does not mutate the original world on add or remove', () => {
    const a = makeWorld();
    const b = addObject(a, tree);
    const c = removeObject(b, 'tree_1');
    expect(a.objects).toEqual({});
    expect(b.objects).toEqual({ tree_1: tree });
    expect(c.objects).toEqual({});
  });
});

describe('getObjectsAt', () => {
  it('returns all objects at a given cell', () => {
    let world = makeWorld();
    world = addObject(world, {
      id: 'a',
      type: 'rock',
      position: { x: 1, y: 1 },
    });
    world = addObject(world, {
      id: 'b',
      type: 'flower',
      position: { x: 1, y: 1 },
    });
    world = addObject(world, {
      id: 'c',
      type: 'rock',
      position: { x: 2, y: 1 },
    });
    const here = getObjectsAt(world, { x: 1, y: 1 }).map((o) => o.id).sort();
    expect(here).toEqual(['a', 'b']);
  });

  it('returns an empty array when no objects are present', () => {
    expect(getObjectsAt(makeWorld(), { x: 0, y: 0 })).toEqual([]);
  });
});

describe('isCellBlocked', () => {
  it('returns true for blocking terrain', () => {
    const world = setTerrain(makeWorld(), {
      position: { x: 2, y: 2 },
      terrain: 'water',
      blocksMovement: true,
    });
    expect(isCellBlocked(world, { x: 2, y: 2 })).toBe(true);
  });

  it('returns false for non-blocking terrain', () => {
    const world = setTerrain(makeWorld(), {
      position: { x: 2, y: 2 },
      terrain: 'grass',
    });
    expect(isCellBlocked(world, { x: 2, y: 2 })).toBe(false);
  });

  it('returns true when a blocking object occupies the cell', () => {
    const world = addObject(makeWorld(), {
      id: 'tree_1',
      type: 'tree',
      position: { x: 4, y: 4 },
      blocksMovement: true,
    });
    expect(isCellBlocked(world, { x: 4, y: 4 })).toBe(true);
  });

  it('returns false when only non-blocking objects occupy the cell', () => {
    const world = addObject(makeWorld(), {
      id: 'flower_1',
      type: 'flower',
      position: { x: 4, y: 4 },
    });
    expect(isCellBlocked(world, { x: 4, y: 4 })).toBe(false);
  });

  it('returns false for an empty in-bounds cell', () => {
    expect(isCellBlocked(makeWorld(), { x: 1, y: 1 })).toBe(false);
  });

  it('treats out-of-bounds cells as blocked', () => {
    const world = makeWorld();
    expect(isCellBlocked(world, { x: -1, y: 0 })).toBe(true);
    expect(isCellBlocked(world, { x: 0, y: -1 })).toBe(true);
    expect(isCellBlocked(world, { x: 10, y: 0 })).toBe(true);
    expect(isCellBlocked(world, { x: 0, y: 10 })).toBe(true);
    expect(isCellBlocked(world, { x: 1.5, y: 1 })).toBe(true);
  });
});

describe('serialization', () => {
  it('round-trips through JSON.stringify / JSON.parse', () => {
    let world = createWorld({
      id: 'demo',
      name: 'Demo',
      grid: createGrid({ width: 8, height: 8, cellSize: 16 }),
    });
    world = setTerrain(world, {
      position: { x: 1, y: 1 },
      terrain: 'water',
      blocksMovement: true,
    });
    world = addObject(world, {
      id: 'tree_1',
      type: 'tree',
      position: { x: 4, y: 4 },
      blocksMovement: true,
      tags: ['flammable'],
      data: { age: 12 },
    });

    const restored = JSON.parse(JSON.stringify(world));
    expect(restored).toEqual(world);
    expect(isCellBlocked(restored, { x: 1, y: 1 })).toBe(true);
    expect(isCellBlocked(restored, { x: 4, y: 4 })).toBe(true);
    expect(isCellBlocked(restored, { x: 0, y: 0 })).toBe(false);
  });
});
