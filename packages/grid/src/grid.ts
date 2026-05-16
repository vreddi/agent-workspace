import type { Direction, GridConfig, GridPosition, WorldPoint } from './types.js';

export function createGrid(config: GridConfig): GridConfig {
  if (!Number.isInteger(config.width) || config.width <= 0) {
    throw new Error(`grid width must be a positive integer, got ${config.width}`);
  }
  if (!Number.isInteger(config.height) || config.height <= 0) {
    throw new Error(`grid height must be a positive integer, got ${config.height}`);
  }
  if (!Number.isInteger(config.layers) || config.layers <= 0) {
    throw new Error(`grid layers must be a positive integer, got ${config.layers}`);
  }
  if (!(config.cellSize > 0) || !Number.isFinite(config.cellSize)) {
    throw new Error(`grid cellSize must be a positive finite number, got ${config.cellSize}`);
  }
  return {
    width: config.width,
    height: config.height,
    layers: config.layers,
    cellSize: config.cellSize,
  };
}

export function isInsideGrid(grid: GridConfig, position: GridPosition): boolean {
  return (
    Number.isInteger(position.x) &&
    Number.isInteger(position.y) &&
    Number.isInteger(position.z) &&
    position.x >= 0 &&
    position.y >= 0 &&
    position.z >= 0 &&
    position.x < grid.width &&
    position.y < grid.height &&
    position.z < grid.layers
  );
}

export function positionsEqual(a: GridPosition, b: GridPosition): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

const FOUR_WAY_OFFSETS: ReadonlyArray<{ x: number; y: number }> = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

export function getNeighbors(grid: GridConfig, position: GridPosition): GridPosition[] {
  const out: GridPosition[] = [];
  for (const offset of FOUR_WAY_OFFSETS) {
    const candidate = {
      x: position.x + offset.x,
      y: position.y + offset.y,
      z: position.z,
    };
    if (isInsideGrid(grid, candidate)) {
      out.push(candidate);
    }
  }
  return out;
}

// Vertical neighbors are returned separately. Pathfinding does not traverse
// them by default — z transitions must be opted into via ramp tiles.
export function getVerticalNeighbors(
  grid: GridConfig,
  position: GridPosition,
): GridPosition[] {
  const out: GridPosition[] = [];
  for (const dz of [-1, 1]) {
    const candidate = { x: position.x, y: position.y, z: position.z + dz };
    if (isInsideGrid(grid, candidate)) {
      out.push(candidate);
    }
  }
  return out;
}

export function gridToWorld(grid: GridConfig, position: GridPosition): WorldPoint {
  return {
    x: position.x * grid.cellSize,
    y: position.y * grid.cellSize,
    z: position.z * grid.cellSize,
  };
}

export function worldToGrid(grid: GridConfig, point: WorldPoint): GridPosition {
  return {
    x: Math.floor(point.x / grid.cellSize),
    y: Math.floor(point.y / grid.cellSize),
    z: Math.floor(point.z / grid.cellSize),
  };
}

export function directionToDelta(direction: Direction): { x: number; y: number } {
  switch (direction) {
    case 'north':
      return { x: 0, y: -1 };
    case 'east':
      return { x: 1, y: 0 };
    case 'south':
      return { x: 0, y: 1 };
    case 'west':
      return { x: -1, y: 0 };
  }
}
