import { describe, expect, it } from 'vitest'

import { lightsOnAt, wallShadowPlacement } from './lighting-renderer.js'

describe('lightsOnAt', () => {
  it('keeps lamps off in full daylight', () => {
    expect(lightsOnAt(1)).toBe(0)
    expect(lightsOnAt(0.6)).toBe(0)
    expect(lightsOnAt(0.7)).toBe(0)
  })

  it('ramps linearly across the dusk fade band', () => {
    // 0 at 0.6, 1 at 0.3, halfway (0.45) → 0.5.
    expect(lightsOnAt(0.45)).toBeCloseTo(0.5, 5)
    expect(lightsOnAt(0.525)).toBeCloseTo(0.25, 5)
    expect(lightsOnAt(0.375)).toBeCloseTo(0.75, 5)
  })

  it('burns lamps fully once night is dark enough', () => {
    expect(lightsOnAt(0.3)).toBe(1)
    expect(lightsOnAt(0.1)).toBe(1)
    expect(lightsOnAt(0)).toBe(1)
  })

  it('clamps out-of-range brightness', () => {
    expect(lightsOnAt(-0.5)).toBe(1)
    expect(lightsOnAt(1.5)).toBe(0)
  })
})

describe('wallShadowPlacement', () => {
  // A 96px-tall tree two tiles north of a house wall, evening sun.
  const tree = {
    casterX: 128,
    casterGroundY: 64,
    casterHeight: 96,
    wallGroundY: 96,
    skewX: 0.5,
    scaleY: 0.5,
  }

  it('projects the silhouette upright, translated only', () => {
    // depth = (96 - 64) / 0.5 = 64 rows of travel to reach the wall plane.
    const placed = wallShadowPlacement(tree)!
    expect(placed.x).toBe(128 + 0.5 * 64) // uniform lean, no per-row skew
    expect(placed.y).toBe(96 + 64 - 96) // only the tree's top 32px climb
  })

  it('climbs higher as the sun drops (longer shadows)', () => {
    const noon = wallShadowPlacement({ ...tree, scaleY: 0.4 })!
    const dusk = wallShadowPlacement({ ...tree, scaleY: 0.9 })!
    // Smaller y = silhouette top sits further up the wall.
    expect(dusk.y).toBeLessThan(noon.y)
  })

  it('ignores walls behind (north of) the caster', () => {
    expect(wallShadowPlacement({ ...tree, wallGroundY: 32 })).toBeNull()
  })

  it('ignores walls the shadow falls short of', () => {
    // Reach = casterHeight * scaleY = 48 ground rows; wall is 64 away.
    expect(
      wallShadowPlacement({ ...tree, wallGroundY: 128, scaleY: 0.5 }),
    ).toBeNull()
  })

  it('leans the opposite way under a morning sun', () => {
    const placed = wallShadowPlacement({ ...tree, skewX: -0.5 })!
    expect(placed.x).toBe(128 - 0.5 * 64)
  })

  it('guards against a degenerate projection', () => {
    expect(wallShadowPlacement({ ...tree, scaleY: 0 })).toBeNull()
  })
})
