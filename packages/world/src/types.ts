import type { GridConfig, GridPosition } from '@worldkit/grid';

export type WorldId = string;
export type EntityId = string;
export type TerrainId = string;
export type ObjectType = string;

export type TerrainCell = {
  position: GridPosition;
  terrain: TerrainId;
  blocksMovement?: boolean;
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
