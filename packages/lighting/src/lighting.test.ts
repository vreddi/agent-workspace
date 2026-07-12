import { describe, expect, it } from 'vitest'
import { AMBIENT_KEYFRAMES, ambientAt, lightLevelAt } from './ambient.js'
import { createClock, tickClock } from './clock.js'
import { hexToRgb } from './color.js'
import { flickerScale } from './lights.js'
import { artMoodAt, normalizeHour, phaseAt } from './phase.js'
import { shadowAt, sunAt } from './sun.js'
import type { PointLight } from './types.js'

describe('phaseAt', () => {
  it('returns the phase at each boundary', () => {
    expect(phaseAt(5)).toBe('dawn')
    expect(phaseAt(7)).toBe('day')
    expect(phaseAt(17.5)).toBe('dusk')
    expect(phaseAt(19.5)).toBe('night')
    expect(phaseAt(4.99)).toBe('night')
    expect(phaseAt(12)).toBe('day')
  })

  it('normalizes hours mod 24', () => {
    expect(normalizeHour(25)).toBe(1)
    expect(normalizeHour(-1)).toBe(23)
    expect(phaseAt(25 + 24)).toBe(phaseAt(1))
    expect(phaseAt(-12)).toBe(phaseAt(12))
  })
})

describe('artMoodAt', () => {
  it('splits day and night palettes at 6.5 and 18.5', () => {
    expect(artMoodAt(6.4)).toBe('night')
    expect(artMoodAt(6.5)).toBe('day')
    expect(artMoodAt(18.4)).toBe('day')
    expect(artMoodAt(18.5)).toBe('night')
  })
})

describe('world clock', () => {
  it('advances by speed * seconds and wraps past 24', () => {
    const clock = createClock({ hour: 23, speed: 1 })
    expect(tickClock(clock, 0.5).hour).toBeCloseTo(23.5)
    expect(tickClock(clock, 2).hour).toBeCloseTo(1)
  })

  it('does not advance when paused, and never mutates', () => {
    const clock = createClock({ hour: 8, running: false })
    const ticked = tickClock(clock, 100)
    expect(ticked.hour).toBe(8)
    expect(ticked).not.toBe(clock)
    expect(clock.hour).toBe(8)
  })

  it('defaults to one game hour per real minute', () => {
    const clock = createClock({ hour: 0 })
    expect(tickClock(clock, 60).hour).toBeCloseTo(1)
  })
})

describe('ambientAt', () => {
  it('hits the keyframes exactly', () => {
    for (const key of AMBIENT_KEYFRAMES) {
      const grade = ambientAt(key.hour)
      expect(grade.tint).toBe(key.tint)
      expect(grade.darkness).toBeCloseTo(key.darkness)
    }
  })

  it('is continuous across the whole day including the midnight wrap', () => {
    let prev = ambientAt(0)
    for (let h = 0.1; h <= 24.001; h += 0.1) {
      const next = ambientAt(h)
      const a = hexToRgb(prev.tint)
      const b = hexToRgb(next.tint)
      for (let c = 0; c < 3; c++) {
        // Steepest ramp (dawn) moves ~11.2 channel units per 0.1h step;
        // rounding can nudge a single step to 12.
        expect(Math.abs(a[c]! - b[c]!)).toBeLessThanOrEqual(12)
      }
      expect(Math.abs(next.darkness - prev.darkness)).toBeLessThan(0.05)
      prev = next
    }
  })

  it('lightLevelAt is the inverse of darkness', () => {
    expect(lightLevelAt(12)).toBeCloseTo(1)
    expect(lightLevelAt(0)).toBeCloseTo(0.25)
  })
})

describe('sun and shadows', () => {
  it('sun is invisible at night, highest at solar noon', () => {
    expect(sunAt(2).visible).toBe(false)
    expect(sunAt(22).visible).toBe(false)
    expect(sunAt(12.25).elevation).toBeCloseTo(1)
    expect(sunAt(12.25).azimuth).toBeCloseTo(0)
  })

  it('casts no shadow at night', () => {
    expect(shadowAt(0)).toBeNull()
    expect(shadowAt(20)).toBeNull()
  })

  it('shadows are shortest at noon and lean west in the morning', () => {
    const morning = shadowAt(8)!
    const noon = shadowAt(12.25)!
    const evening = shadowAt(17)!
    expect(noon.scaleY).toBeLessThan(morning.scaleY)
    expect(morning.skewX).toBeLessThan(0)
    expect(evening.skewX).toBeGreaterThan(0)
    for (const projection of [morning, noon, evening]) {
      expect(projection.alpha).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('flickerScale', () => {
  const light: PointLight = {
    id: 'lamp:3,4',
    x: 0,
    y: 0,
    radius: 80,
    color: '#ffb45e',
    intensity: 0.9,
    flicker: 0.4,
  }

  it('is deterministic and bounded by the flicker amount', () => {
    for (let frame = 0; frame < 50; frame++) {
      const scale = flickerScale(light, frame)
      expect(scale).toBe(flickerScale(light, frame))
      expect(scale).toBeGreaterThanOrEqual(1 - 0.4 * 0.25)
      expect(scale).toBeLessThanOrEqual(1 + 0.4 * 0.25)
    }
  })

  it('returns 1 for lights without flicker', () => {
    expect(flickerScale({ ...light, flicker: undefined }, 7)).toBe(1)
  })
})
