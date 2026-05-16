import { createGrid, isInsideGrid } from '@worldkit/grid';
import type { GridConfig, GridPosition } from '@worldkit/grid';
import type {
  EntityId,
  TerrainCell,
  World,
  WorldObject,
} from './types.js';

export function getCellKey(position: GridPosition): string {
  return `${position.x},${position.y},${position.z}`;
}

export function createWorld(input: {
  id: string;
  name?: string;
  grid: GridConfig;
}): World {
  if (typeof input.id !== 'string' || input.id.length === 0) {
    throw new Error('world id must be a non-empty string');
  }
  const grid = createGrid(input.grid);
  const world: World = {
    id: input.id,
    grid,
    terrain: {},
    objects: {},
  };
  if (input.name !== undefined) {
    world.name = input.name;
  }
  return world;
}

export function setTerrain(world: World, cell: TerrainCell): World {
  if (!isInsideGrid(world.grid, cell.position)) {
    throw new Error(
      `terrain position ${getCellKey(cell.position)} is outside grid bounds`,
    );
  }
  const key = getCellKey(cell.position);
  return {
    ...world,
    terrain: {
      ...world.terrain,
      [key]: { ...cell, position: { ...cell.position } },
    },
  };
}

export function getTerrain(
  world: World,
  position: GridPosition,
): TerrainCell | undefined {
  return world.terrain[getCellKey(position)];
}

export function removeTerrain(
  world: World,
  position: GridPosition,
): World {
  const key = getCellKey(position);
  if (!(key in world.terrain)) {
    return world;
  }
  const { [key]: _removed, ...rest } = world.terrain;
  return { ...world, terrain: rest };
}

export function addObject(world: World, object: WorldObject): World {
  if (typeof object.id !== 'string' || object.id.length === 0) {
    throw new Error('object id must be a non-empty string');
  }
  if (object.id in world.objects) {
    throw new Error(`object with id "${object.id}" already exists`);
  }
  if (!isInsideGrid(world.grid, object.position)) {
    throw new Error(
      `object "${object.id}" position ${getCellKey(object.position)} is outside grid bounds`,
    );
  }
  return {
    ...world,
    objects: {
      ...world.objects,
      [object.id]: { ...object, position: { ...object.position } },
    },
  };
}

export function removeObject(world: World, objectId: EntityId): World {
  if (!(objectId in world.objects)) {
    return world;
  }
  const { [objectId]: _removed, ...rest } = world.objects;
  return { ...world, objects: rest };
}

export function getObject(
  world: World,
  objectId: EntityId,
): WorldObject | undefined {
  return world.objects[objectId];
}

export function getObjectsAt(
  world: World,
  position: GridPosition,
): WorldObject[] {
  const out: WorldObject[] = [];
  for (const object of Object.values(world.objects)) {
    if (
      object.position.x === position.x &&
      object.position.y === position.y &&
      object.position.z === position.z
    ) {
      out.push(object);
    }
  }
  return out;
}

// In 2.5D semantics, a cell is standable only when it has a non-blocking
// terrain tile (the "floor") and no blocking object on top. Cells with no
// terrain are treated as empty air — not standable, not enterable.
export function isCellStandable(
  world: World,
  position: GridPosition,
): boolean {
  if (!isInsideGrid(world.grid, position)) {
    return false;
  }
  const terrain = getTerrain(world, position);
  if (!terrain) {
    return false;
  }
  if (terrain.blocksMovement) {
    return false;
  }
  return !getObjectsAt(world, position).some(
    (object) => object.blocksMovement,
  );
}

export function isCellBlocked(
  world: World,
  position: GridPosition,
): boolean {
  return !isCellStandable(world, position);
}
