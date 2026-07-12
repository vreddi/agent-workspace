import { describe, expect, it } from 'vitest'

import { makeVerdantTileset, propBaseCells } from '@worldkit/tilemap'
import type { TileMap, Tileset } from '@worldkit/tilemap'
import { makeBoroughScene } from './the-borough'

/** Cells a resident could never stand on: blocking ground or a solid prop base. */
function blockedCells(map: TileMap, tileset: Tileset): Set<string> {
  const blocked = new Set<string>()
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = tileset.tiles[map.ground[y * map.width + x]!]!
      if (!tile.walkable) blocked.add(`${x},${y}`)
    }
  }
  for (const placement of map.props) {
    const def = tileset.props[placement.prop]!
    if (def.walkable) continue
    for (const cell of propBaseCells(placement, tileset)) {
      blocked.add(`${cell.x},${cell.y}`)
    }
  }
  return blocked
}

/** Count of walkable cells reachable from a start via 4-way flood fill. */
function reachableFrom(
  map: TileMap,
  blocked: Set<string>,
  start: { x: number; y: number },
): Set<string> {
  const seen = new Set<string>()
  const stack = [start]
  while (stack.length > 0) {
    const { x, y } = stack.pop()!
    const key = `${x},${y}`
    if (seen.has(key)) continue
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue
    if (blocked.has(key)) continue
    seen.add(key)
    stack.push(
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    )
  }
  return seen
}

describe('makeBoroughScene', () => {
  it('parses cleanly in both lighting moods', () => {
    expect(() => makeBoroughScene('day')).not.toThrow()
    expect(() => makeBoroughScene('night')).not.toThrow()
  })

  it('is a 20x13 clearing with the three spawn markers', () => {
    const { map } = makeBoroughScene('night')
    expect(map.width).toBe(20)
    expect(map.height).toBe(13)
    expect(map.markers['home-pink']).toBeDefined()
    expect(map.markers['home-owlet']).toBeDefined()
    expect(map.markers['home-dude']).toBeDefined()
  })

  it('places all three cottages', () => {
    const { map } = makeBoroughScene('night')
    const houses = map.props.filter((p) => p.prop.startsWith('house-'))
    const ids = new Set(houses.map((p) => p.prop))
    expect(ids).toEqual(new Set(['house-thatch', 'house-slate', 'house-plum']))
  })

  it('keeps every resident spawn mutually reachable', () => {
    const scene = makeBoroughScene('night')
    const { map } = scene
    const blocked = blockedCells(map, scene.tileset)
    const reachable = reachableFrom(map, blocked, map.markers['home-pink']!)
    // Each home is reachable from Poppy's door, so residents never strand.
    expect(reachable.has(keyOf(map.markers['home-owlet']!))).toBe(true)
    expect(reachable.has(keyOf(map.markers['home-dude']!))).toBe(true)
  })
})

function keyOf(p: { x: number; y: number }): string {
  return `${p.x},${p.y}`
}
