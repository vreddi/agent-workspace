import { describe, expect, it } from 'vitest'

import { lightsOnAt } from './lighting-renderer.js'

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
