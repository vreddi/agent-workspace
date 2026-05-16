import type { Direction, GridConfig, GridPosition } from '@worldkit/grid';

export type WorldId = string;
export type EntityId = string;
export type TerrainId = string;
export type ObjectType = string;

// A ramp lets an agent on this cell step to the adjacent cell one layer up.
// `up: 'north'` means the upward-sloping side faces north — stepping north from
// this cell lands you at (x, y-1, z+1), and stepping south from (x, y-1, z+1)
// lands you back here.
export type Ramp = {
  up: Direction;
};

export type TerrainCell = {
  position: GridPosition;
  terrain: TerrainId;
  blocksMovement?: boolean;
  ramp?: Ramp;
};

export type WorldObject = {
  id: EntityId;
  type: ObjectType;
  position: GridPosition;
  blocksMovement?: boolean;
  tags?: string[];
  data?: Record<string, unknown>;
};

export type World = {
  id: WorldId;
  name?: string;
  grid: GridConfig;
  terrain: Record<string, TerrainCell>;
  objects: Record<EntityId, WorldObject>;
};
