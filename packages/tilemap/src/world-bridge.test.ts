import { findPath } from '@worldkit/pathfinding'
import { isCellBlocked } from '@worldkit/world'
import { describe, expect, it } from 'vitest'
import { parseMap } from './map.js'
import { COZY_TILESET } from './tiles/index.js'
import { mapToWorld } from './world-bridge.js'
import type { Legend } from './map.js'

const LEGEND: Legend = {
  '.': { kind: 'tile', tile: 'grass' },
  '~': { kind: 'tile', tile: 'water' },
  T: { kind: 'prop', prop: 'tree' },
}

describe('mapToWorld', () => {
  it('blocks water and prop bases, keeps grass walkable', () => {
    const world = mapToWorld(
      parseMap(['..~', '.T.', '...'], LEGEND, COZY_TILESET),
      COZY_TILESET,
    )
    expect(isCellBlocked(world, { x: 0, y: 0, z: 0 })).toBe(false)
    expect(isCellBlocked(world, { x: 2, y: 0, z: 0 })).toBe(true) // water
    expect(isCellBlocked(world, { x: 1, y: 1, z: 0 })).toBe(true) // tree
  })

  it('produces a world A* can path through', () => {
    // Wall of trees with a gap at the bottom.
    const world = mapToWorld(
      parseMap(['.....', 'TTTT.', '.....'], LEGEND, COZY_TILESET),
      COZY_TILESET,
    )
    const path = findPath(world, { x: 0, y: 0, z: 0 }, { x: 0, y: 2, z: 0 })
    expect(path).toBeDefined()
    // Must route around the tree wall through the gap at x=4.
    expect(path!.some((p) => p.x === 4 && p.y === 1)).toBe(true)
  })
})
