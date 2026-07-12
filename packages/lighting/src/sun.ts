import { normalizeHour } from './phase.js'
import { DAWN_START, NIGHT_START } from './types.js'
import type { ShadowProjection, SunState } from './types.js'

/** Midpoint of the sun's arc — when shadows are shortest. */
export const SOLAR_NOON = (DAWN_START + NIGHT_START) / 2

/** Horizontal shadow lean at the horizon (CSS-transform-style skew factor). */
const MAX_SKEW = 1.6
/** Shadow length as a fraction of prop height: horizon .. noon. */
const LONGEST_SHADOW = 0.9
const SHORTEST_SHADOW = 0.3
/** Shadow opacity at full sun. */
const MAX_ALPHA = 0.38

export function sunAt(hour: number): SunState {
  const h = normalizeHour(hour)
  if (h < DAWN_START || h >= NIGHT_START) {
    return { visible: false, elevation: 0, azimuth: 0 }
  }
  const span = NIGHT_START - DAWN_START
  const progress = (h - DAWN_START) / span
  return {
    visible: true,
    // Sine arc: 0 at the horizon edges, 1 at solar noon.
    elevation: Math.sin(Math.PI * progress),
    // -1 rising in the east, +1 setting in the west.
    azimuth: (h - SOLAR_NOON) / (span / 2),
  }
}

/**
 * How prop silhouettes fall on the ground at this hour: long west-leaning
 * shadows at dawn, short at noon, long east-leaning at dusk, none at night.
 */
export function shadowAt(hour: number): ShadowProjection | null {
  const sun = sunAt(hour)
  if (!sun.visible) return null
  return {
    // Shadows point away from the sun: east sun (-1) leans them west.
    skewX: sun.azimuth * MAX_SKEW,
    scaleY:
      SHORTEST_SHADOW +
      (LONGEST_SHADOW - SHORTEST_SHADOW) * (1 - sun.elevation),
    // Fade in/out near the horizon instead of popping.
    alpha: MAX_ALPHA * Math.min(1, sun.elevation / 0.25),
  }
}
