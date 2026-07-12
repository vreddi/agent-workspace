export type {
  EntityId,
  ObjectType,
  Ramp,
  TerrainCell,
  TerrainId,
  World,
  WorldId,
  WorldObject,
} from './types.js'
export {
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
} from './world.js'
