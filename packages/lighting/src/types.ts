export type DayPhase = 'night' | 'dawn' | 'day' | 'dusk'

/** Hour (inclusive) at which dawn begins. */
export const DAWN_START = 5
/** Hour (inclusive) at which full day begins. */
export const DAY_START = 7
/** Hour (inclusive) at which dusk begins. */
export const DUSK_START = 17.5
/** Hour (inclusive) at which night begins. */
export const NIGHT_START = 19.5

/** A continuous world clock. `hour` is a float in [0, 24). */
export type WorldClock = {
  hour: number
  /** Game-hours advanced per real second. */
  speed: number
  running: boolean
}

/**
 * Ambient color grade for the whole scene. `tint` drives a multiply layer,
 * `glow` an additive/screen halo, `darkness` the overall night-strength 0..1.
 */
export type AmbientGrade = {
  tint: string
  glow: string
  darkness: number
}

/**
 * Sun position derived from the hour. `elevation` 0 (horizon) .. 1 (noon),
 * `azimuth` -1 (east/morning) .. +1 (west/evening).
 */
export type SunState = {
  visible: boolean
  elevation: number
  azimuth: number
}

/** How a prop silhouette is cast onto the ground. */
export type ShadowProjection = {
  skewX: number
  scaleY: number
  alpha: number
}

/**
 * A placed point light. Structurally compatible with `PlacedLight` from
 * `@worldkit/tilemap`, but this package never imports tilemap (zero deps).
 */
export type PointLight = {
  id: string
  x: number
  y: number
  radius: number
  color: string
  intensity: number
  flicker?: number
}
