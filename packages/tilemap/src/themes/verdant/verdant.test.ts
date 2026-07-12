import { describe, expect, it } from 'vitest'
import type { PixelArt } from '../../pixel-art.js'
import type { Tileset } from '../../tileset.js'
import { makeVerdantTileset } from './index.js'

const EXPECTED_TILES = [
  'grass',
  'meadow',
  'tall-grass',
  'flowers',
  'fireflies',
  'path',
  'cobble',
  'water',
]

const EXPECTED_PROPS = [
  'oak',
  'pine',
  'bush',
  'rock',
  'stump',
  'sign',
  'mushrooms',
  'lamp-post',
  'well',
  'market-stall',
  'house-thatch',
  'house-slate',
  'house-plum',
]

/** Fraction of pixels with a non-zero alpha channel. */
function opaqueFraction(frame: PixelArt): number {
  let opaque = 0
  const count = frame.width * frame.height
  for (let i = 0; i < count; i++) {
    if (frame.data[i * 4 + 3]! > 0) opaque++
  }
  return opaque / count
}

/** True when every pixel is fully opaque (alpha 255). */
function isFullyOpaque(frame: PixelArt): boolean {
  const count = frame.width * frame.height
  for (let i = 0; i < count; i++) {
    if (frame.data[i * 4 + 3] !== 255) return false
  }
  return true
}

describe('verdant tileset', () => {
  it('builds for both lighting moods', () => {
    expect(() => makeVerdantTileset('day')).not.toThrow()
    expect(() => makeVerdantTileset('night')).not.toThrow()
  })

  for (const time of ['day', 'night'] as const) {
    describe(time, () => {
      const tileset: Tileset = makeVerdantTileset(time)

      it('has every expected tile id', () => {
        for (const id of EXPECTED_TILES) {
          expect(tileset.tiles[id], id).toBeDefined()
        }
      })

      it('has every expected prop id', () => {
        for (const id of EXPECTED_PROPS) {
          expect(tileset.props[id], id).toBeDefined()
        }
      })

      it('grass has at least two variant frame-sets', () => {
        expect(tileset.tiles.grass!.variants?.length ?? 0).toBeGreaterThanOrEqual(
          2,
        )
      })

      it('animated ground tiles have at least two frames', () => {
        for (const id of ['water', 'flowers', 'tall-grass', 'fireflies']) {
          expect(tileset.tiles[id]!.frames.length, id).toBeGreaterThanOrEqual(2)
        }
      })

      it('every ground tile frame and variant is fully opaque', () => {
        for (const tile of Object.values(tileset.tiles)) {
          for (const frame of tile.frames) {
            expect(isFullyOpaque(frame), tile.id).toBe(true)
          }
          for (const variant of tile.variants ?? []) {
            for (const frame of variant) {
              expect(isFullyOpaque(frame), `${tile.id} variant`).toBe(true)
            }
          }
        }
      })

      it('props draw substantial art (not near-empty frames)', () => {
        for (const id of ['oak', 'well', 'market-stall', 'house-thatch']) {
          expect(opaqueFraction(tileset.props[id]!.frames[0]!), id).toBeGreaterThan(
            0.15,
          )
        }
      })
    })
  }

  it('night lights the lamp-post and all three houses; day does not', () => {
    const night = makeVerdantTileset('night')
    const day = makeVerdantTileset('day')
    for (const id of ['lamp-post', 'house-thatch', 'house-slate', 'house-plum']) {
      expect(night.props[id]!.lights?.length ?? 0, id).toBeGreaterThan(0)
      expect(day.props[id]!.lights?.length ?? 0, id).toBe(0)
    }
    // Houses carry one light per window.
    for (const id of ['house-thatch', 'house-slate', 'house-plum']) {
      expect(night.props[id]!.lights?.length, id).toBe(2)
    }
  })
})
