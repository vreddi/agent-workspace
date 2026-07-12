import { addObject, createWorld, setTerrain } from '@worldkit/world'
import type { World } from '@worldkit/world'
import { propBaseCells } from './map.js'
import type { TileMap } from './map.js'
import type { Tileset } from './tileset.js'

export type MapToWorldOptions = {
  id?: string
  /** World pixels per cell. Default 32 (16px art at 2x). */
  cellSize?: number
}

/**
 * Builds a @worldkit/world World from a parsed map so @worldkit/pathfinding
 * works unchanged: ground tiles become terrain (blocking when not walkable)
 * and prop bases become blocking objects.
 */
export function mapToWorld(
  map: TileMap,
  tileset: Tileset,
  options: MapToWorldOptions = {},
): World {
  let world = createWorld({
    id: options.id ?? 'tilemap',
    grid: {
      width: map.width,
      height: map.height,
      layers: 1,
      cellSize: options.cellSize ?? 32,
    },
  })

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tileId = map.ground[y * map.width + x]!
      const tile = tileset.tiles[tileId]!
      world = setTerrain(world, {
        position: { x, y, z: 0 },
        terrain: tile.terrain ?? tile.id,
        ...(tile.walkable ? {} : { blocksMovement: true }),
      })
    }
  }

  for (const [index, placement] of map.props.entries()) {
    const def = tileset.props[placement.prop]!
    if (def.walkable) continue
    for (const cell of propBaseCells(placement, tileset)) {
      world = addObject(world, {
        id: `${placement.prop}:${index}:${cell.x},${cell.y}`,
        type: placement.prop,
        position: cell,
        blocksMovement: true,
      })
    }
  }

  return world
}
