import type { GridPosition } from '@worldkit/grid'
import type { SpriteSheet } from '@worldkit/sprite-actor'
import type { TileMap, Tileset } from '@worldkit/tilemap'

/** A character who lives in the scene. */
export type Resident = {
  id: string
  name: string
  sheet: SpriteSheet
  /**
   * The cell in front of their front door: where they spawn, and where they
   * drift back to between strolls.
   */
  home: GridPosition
  /** Dialogue shown (one box per line) when the player talks to them. */
  lines: string[]
}

export type VillageScene = {
  name: string
  map: TileMap
  tileset: Tileset
  residents: Resident[]
}
