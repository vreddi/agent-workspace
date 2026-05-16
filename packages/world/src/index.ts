export type {
  EntityId,
  ObjectType,
  TerrainCell,
  TerrainId,
  World,
  WorldId,
  WorldObject,
} from './types.js';
export {
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
