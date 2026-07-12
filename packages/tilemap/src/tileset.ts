import type { PixelArt } from './pixel-art.js'

export type TileId = string
export type PropId = string

/**
 * Native art pixels per tile. Matches the 32x32 sprite frames 1:1, so the
 * world renders at the same pixel density as the characters.
 */
export const TILE_SIZE = 32

export type TileDef = {
  id: TileId
  /** Animation frames (at least one), each TILE_SIZE x TILE_SIZE. */
  frames: PixelArt[]
  walkable: boolean
  /**
   * Terrain kind used when bridging to @worldkit/world and for edge
   * detection (e.g. water rims). Defaults to `id`.
   */
  terrain?: string
  /**
   * If set, the renderer draws a rim of this color along edges that border
   * a different terrain (classic GBA shorelines).
   */
  rim?: string
}

export type PropDef = {
  id: PropId
  /** Animation frames, each (tilesWide * 16) x (tilesHigh * 16). */
  frames: PixelArt[]
  /** Footprint width in tiles. */
  tilesWide: number
  /** Full visual height in tiles. */
  tilesHigh: number
  /**
   * How many bottom rows sit on the ground. These rows block movement and
   * draw below characters; the rows above draw on the overhang canvas,
   * covering characters that walk behind (tree canopies, roofs).
   */
  baseRows: number
  /** Props block movement by default. */
  walkable?: boolean
}

export type Tileset = {
  tiles: Record<TileId, TileDef>
  props: Record<PropId, PropDef>
}

function assertFrameSize(
  kind: string,
  id: string,
  frames: PixelArt[],
  width: number,
  height: number,
): void {
  if (frames.length === 0) {
    throw new Error(`${kind} "${id}" needs at least one frame`)
  }
  for (const frame of frames) {
    if (frame.width !== width || frame.height !== height) {
      throw new Error(
        `${kind} "${id}" frame is ${frame.width}x${frame.height}, expected ${width}x${height}`,
      )
    }
  }
}

export function defineTile(tile: TileDef): TileDef {
  assertFrameSize('tile', tile.id, tile.frames, TILE_SIZE, TILE_SIZE)
  return tile
}

export function defineProp(prop: PropDef): PropDef {
  if (prop.baseRows < 1 || prop.baseRows > prop.tilesHigh) {
    throw new Error(
      `prop "${prop.id}" baseRows must be between 1 and tilesHigh (${prop.tilesHigh})`,
    )
  }
  assertFrameSize(
    'prop',
    prop.id,
    prop.frames,
    prop.tilesWide * TILE_SIZE,
    prop.tilesHigh * TILE_SIZE,
  )
  return prop
}
