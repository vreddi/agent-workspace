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
  isCellStandable,
  removeObject,
  removeTerrain,
  setTerrain,
} from './world.js';

const makeWorld = (layers = 1) =>
  createWorld({
    id: 'demo',
    grid: createGrid({ width: 10, height: 10, layers, cellSize: 32 }),
  });

// Fills the bottom layer with non-blocking 'floor' terrain so cells are
// standable for tests that don't care about the floor explicitly.
const withFloor = (world: ReturnType<typeof makeWorld>, z = 0) => {
  let next = world;
  for (let y = 0; y < world.grid.height; y++) {
    for (let x = 0; x < world.grid.width; x++) {
      next = setTerrain(next, {
        position: { x, y, z },
        terrain: 'floor',
      });
    }
  }
  return next;
};

describe('getCellKey', () => {
  it('produces a stable key from a position', () => {
    expect(getCellKey({ x: 3, y: 4, z: 0 })).toBe('3,4,0');
  });

  it('distinguishes (x,y) from (y,x)', () => {
    expect(getCellKey({ x: 1, y: 2, z: 0 })).not.toBe(
      getCellKey({ x: 2, y: 1, z: 0 }),
    );
  });

  it('distinguishes between layers at the same (x,y)', () => {
    expect(getCellKey({ x: 1, y: 1, z: 0 })).not.toBe(
      getCellKey({ x: 1, y: 1, z: 1 }),
    );
  });
});

describe('createWorld', () => {
  it('creates an empty world with grid', () => {
    const world = makeWorld();
    expect(world.id).toBe('demo');
    expect(world.grid).toEqual({
      width: 10,
      height: 10,
      layers: 1,
      cellSize: 32,
    });
    expect(world.terrain).toEqual({});
    expect(world.objects).toEqual({});
  });

  it('accepts an optional name', () => {
    const world = createWorld({
      id: 'demo',
      name: 'Demo World',
      grid: createGrid({ width: 4, height: 4, layers: 1, cellSize: 16 }),
    });
    expect(world.name).toBe('Demo World');
  });

  it('rejects an empty id', () => {
    expect(() =>
      createWorld({
        id: '',
        grid: createGrid({ width: 4, height: 4, layers: 1, cellSize: 16 }),
      }),
    ).toThrow();
  });
});

describe('setTerrain / getTerrain', () => {
  it('sets and reads a terrain cell', () => {
    const world = setTerrain(makeWorld(), {
      position: { x: 3, y: 4, z: 0 },
      terrain: 'grass',
    });
    expect(getTerrain(world, { x: 3, y: 4, z: 0 })).toEqual({
      position: { x: 3, y: 4, z: 0 },
      terrain: 'grass',
    });
  });

  it('returns undefined when no terrain is set', () => {
    expect(getTerrain(makeWorld(), { x: 0, y: 0, z: 0 })).toBeUndefined();
  });

  it('stores terrain at distinct layers independently', () => {
    let world = makeWorld(2);
    world = setTerrain(world, {
      position: { x: 1, y: 1, z: 0 },
      terrain: 'grass',
    });
    world = setTerrain(world, {
      position: { x: 1, y: 1, z: 1 },
      terrain: 'wood-floor',
    });
    expect(getTerrain(world, { x: 1, y: 1, z: 0 })?.terrain).toBe('grass');
    expect(getTerrain(world, { x: 1, y: 1, z: 1 })?.terrain).toBe('wood-floor');
  });

  it('persists ramp metadata', () => {
    const world = setTerrain(makeWorld(2), {
      position: { x: 2, y: 2, z: 0 },
      terrain: 'ramp',
      ramp: { up: 'north' },
    });
    expect(getTerrain(world, { x: 2, y: 2, z: 0 })?.ramp).toEqual({
      up: 'north',
    });
  });

  it('overwrites existing terrain at the same cell', () => {
    let world = setTerrain(makeWorld(), {
      position: { x: 1, y: 1, z: 0 },
      terrain: 'grass',
    });
    world = setTerrain(world, {
      position: { x: 1, y: 1, z: 0 },
      terrain: 'water',
      blocksMovement: true,
    });
    expect(getTerrain(world, { x: 1, y: 1, z: 0 })).toEqual({
      position: { x: 1, y: 1, z: 0 },
      terrain: 'water',
      blocksMovement: true,
    });
  });

  it('does not mutate the original world', () => {
    const a = makeWorld();
    const b = setTerrain(a, {
      position: { x: 0, y: 0, z: 0 },
      terrain: 'grass',
    });
    expect(a.terrain).toEqual({});
    expect(b).not.toBe(a);
  });

  it('rejects terrain outside the grid', () => {
    expect(() =>
      setTerrain(makeWorld(), {
        position: { x: 10, y: 0, z: 0 },
        terrain: 'grass',
      }),
    ).toThrow();
    expect(() =>
      setTerrain(makeWorld(), {
        position: { x: 0, y: 0, z: 1 },
        terrain: 'grass',
      }),
    ).toThrow();
  });
});

describe('removeTerrain', () => {
  it('removes terrain at a cell', () => {
    let world = setTerrain(makeWorld(), {
      position: { x: 2, y: 2, z: 0 },
      terrain: 'grass',
    });
    world = removeTerrain(world, { x: 2, y: 2, z: 0 });
    expect(getTerrain(world, { x: 2, y: 2, z: 0 })).toBeUndefined();
  });

  it('is a no-op when no terrain exists at the cell', () => {
    const world = makeWorld();
    expect(removeTerrain(world, { x: 0, y: 0, z: 0 })).toBe(world);
  });
});

describe('addObject / getObject / removeObject', () => {
  const tree = {
    id: 'tree_1',
    type: 'tree',
    position: { x: 5, y: 5, z: 0 },
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
      addObject(makeWorld(), { ...tree, position: { x: -1, y: 0, z: 0 } }),
    ).toThrow();
    expect(() =>
      addObject(makeWorld(), { ...tree, position: { x: 10, y: 10, z: 0 } }),
    ).toThrow();
    expect(() =>
      addObject(makeWorld(), { ...tree, position: { x: 0, y: 0, z: 5 } }),
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
  it('returns all objects at a given cell (matching all three axes)', () => {
    let world = makeWorld(2);
    world = addObject(world, {
      id: 'a',
      type: 'rock',
      position: { x: 1, y: 1, z: 0 },
    });
    world = addObject(world, {
      id: 'b',
      type: 'flower',
      position: { x: 1, y: 1, z: 0 },
    });
    world = addObject(world, {
      id: 'c',
      type: 'rock',
      position: { x: 2, y: 1, z: 0 },
    });
    world = addObject(world, {
      id: 'd',
      type: 'rock',
      position: { x: 1, y: 1, z: 1 },
    });
    const here = getObjectsAt(world, { x: 1, y: 1, z: 0 })
      .map((o) => o.id)
      .sort();
    expect(here).toEqual(['a', 'b']);
  });

  it('returns an empty array when no objects are present', () => {
    expect(getObjectsAt(makeWorld(), { x: 0, y: 0, z: 0 })).toEqual([]);
  });
});

describe('isCellStandable / isCellBlocked', () => {
  it('treats a non-blocking terrain cell with no objects as standable', () => {
    const world = setTerrain(makeWorld(), {
      position: { x: 2, y: 2, z: 0 },
      terrain: 'grass',
    });
    expect(isCellStandable(world, { x: 2, y: 2, z: 0 })).toBe(true);
    expect(isCellBlocked(world, { x: 2, y: 2, z: 0 })).toBe(false);
  });

  it('treats a cell with no terrain as blocked (empty air)', () => {
    const world = makeWorld();
    expect(isCellStandable(world, { x: 1, y: 1, z: 0 })).toBe(false);
    expect(isCellBlocked(world, { x: 1, y: 1, z: 0 })).toBe(true);
  });

  it('treats blocking terrain as not standable', () => {
    const world = setTerrain(makeWorld(), {
      position: { x: 2, y: 2, z: 0 },
      terrain: 'water',
      blocksMovement: true,
    });
    expect(isCellStandable(world, { x: 2, y: 2, z: 0 })).toBe(false);
  });

  it('treats a floor + blocking object as not standable', () => {
    let world = withFloor(makeWorld());
    world = addObject(world, {
      id: 'tree_1',
      type: 'tree',
      position: { x: 4, y: 4, z: 0 },
      blocksMovement: true,
    });
    expect(isCellStandable(world, { x: 4, y: 4, z: 0 })).toBe(false);
  });

  it('treats a floor + non-blocking object as standable', () => {
    let world = withFloor(makeWorld());
    world = addObject(world, {
      id: 'flower_1',
      type: 'flower',
      position: { x: 4, y: 4, z: 0 },
    });
    expect(isCellStandable(world, { x: 4, y: 4, z: 0 })).toBe(true);
  });

  it('treats out-of-bounds cells as blocked', () => {
    const world = makeWorld();
    expect(isCellBlocked(world, { x: -1, y: 0, z: 0 })).toBe(true);
    expect(isCellBlocked(world, { x: 0, y: -1, z: 0 })).toBe(true);
    expect(isCellBlocked(world, { x: 10, y: 0, z: 0 })).toBe(true);
    expect(isCellBlocked(world, { x: 0, y: 10, z: 0 })).toBe(true);
    expect(isCellBlocked(world, { x: 0, y: 0, z: 1 })).toBe(true);
    expect(isCellBlocked(world, { x: 1.5, y: 1, z: 0 })).toBe(true);
  });

  it('does not allow a cell on z=1 to be standable just because z=0 has terrain', () => {
    const world = setTerrain(makeWorld(2), {
      position: { x: 0, y: 0, z: 0 },
      terrain: 'grass',
    });
    expect(isCellStandable(world, { x: 0, y: 0, z: 0 })).toBe(true);
    expect(isCellStandable(world, { x: 0, y: 0, z: 1 })).toBe(false);
  });
});

describe('serialization', () => {
  it('round-trips through JSON.stringify / JSON.parse', () => {
    let world = createWorld({
      id: 'demo',
      name: 'Demo',
      grid: createGrid({ width: 8, height: 8, layers: 2, cellSize: 16 }),
    });
    world = setTerrain(world, {
      position: { x: 1, y: 1, z: 0 },
      terrain: 'water',
      blocksMovement: true,
    });
    world = setTerrain(world, {
      position: { x: 2, y: 2, z: 0 },
      terrain: 'ramp',
      ramp: { up: 'east' },
    });
    world = addObject(world, {
      id: 'tree_1',
      type: 'tree',
      position: { x: 4, y: 4, z: 0 },
      blocksMovement: true,
      tags: ['flammable'],
      data: { age: 12 },
    });

    const restored = JSON.parse(JSON.stringify(world));
    expect(restored).toEqual(world);
    expect(isCellBlocked(restored, { x: 1, y: 1, z: 0 })).toBe(true);
    expect(isCellBlocked(restored, { x: 4, y: 4, z: 0 })).toBe(true);
    expect(isCellStandable(restored, { x: 2, y: 2, z: 0 })).toBe(true);
  });
});
