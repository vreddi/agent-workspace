export type GridPosition = {
  x: number
  y: number
  z: number
}

export type GridConfig = {
  width: number
  height: number
  layers: number
  cellSize: number
}

export type WorldPoint = {
  x: number
  y: number
  z: number
}

export type Direction = 'north' | 'east' | 'south' | 'west'
