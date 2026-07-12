import { groundAt } from './map.js'
import type { TileMap } from './map.js'
import { TILE_SIZE } from './tileset.js'
import type { LightEmitter, Tileset } from './tileset.js'

/** A light emitter resolved to absolute art-pixel scene coordinates. */
export type PlacedLight = LightEmitter & { id: string }

/**
 * Resolves every light emitter declared by placed props and ground tiles to
 * absolute art-pixel coordinates. Feed the result to a lighting compositor.
 */
export function collectLights(map: TileMap, tileset: Tileset): PlacedLight[] {
  const lights: PlacedLight[] = []

  for (const placement of map.props) {
    const def = tileset.props[placement.prop]
    if (!def?.lights) continue
    // The prop's visual top-left: anchor is the bottom-left cell of its base.
    const originX = placement.x * TILE_SIZE
    const originY = (placement.y + 1 - def.tilesHigh) * TILE_SIZE
    def.lights.forEach((light, index) => {
      lights.push({
        ...light,
        id: `prop:${placement.prop}:${placement.x},${placement.y}:${index}`,
        x: originX + light.x,
        y: originY + light.y,
      })
    })
  }

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = tileset.tiles[groundAt(map, x, y)]
      if (!tile?.lights) continue
      tile.lights.forEach((light, index) => {
        lights.push({
          ...light,
          id: `tile:${tile.id}:${x},${y}:${index}`,
          x: x * TILE_SIZE + light.x,
          y: y * TILE_SIZE + light.y,
        })
      })
    }
  }

  return lights
}
