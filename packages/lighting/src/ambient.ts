import { hexToRgb, lerp, lerpRgb, rgbToHex } from './color.js'
import { normalizeHour } from './phase.js'
import { type AmbientGrade } from './types.js'

/**
 * Ambient keyframes across the day. `ambientAt` interpolates piecewise-linearly
 * between them in RGB space, wrapping smoothly across the 24 -> 0 boundary
 * (the last keyframe at hour 22 matches the first at hour 0).
 */
export const AMBIENT_KEYFRAMES: ReadonlyArray<AmbientGrade & { hour: number }> =
  [
    { hour: 0.0, tint: '#2c3555', glow: '#1a2440', darkness: 0.75 },
    { hour: 4.5, tint: '#31395c', glow: '#1e2a48', darkness: 0.72 },
    { hour: 6.0, tint: '#d9a08a', glow: '#5a3a52', darkness: 0.3 },
    { hour: 7.5, tint: '#f4e3c8', glow: '#3a3040', darkness: 0.1 },
    { hour: 12.0, tint: '#ffffff', glow: '#000000', darkness: 0.0 },
    { hour: 16.5, tint: '#ffd9a0', glow: '#40260e', darkness: 0.12 },
    { hour: 18.5, tint: '#c76f5e', glow: '#4a2440', darkness: 0.32 },
    { hour: 20.0, tint: '#3a4066', glow: '#20284a', darkness: 0.65 },
    { hour: 22.0, tint: '#2c3555', glow: '#1a2440', darkness: 0.75 },
  ]

// Virtual keyframe at hour 24 (a copy of hour 0) so the segment from the last
// real keyframe to midnight interpolates continuously.
const WRAPPED: ReadonlyArray<AmbientGrade & { hour: number }> = [
  ...AMBIENT_KEYFRAMES,
  { ...AMBIENT_KEYFRAMES[0], hour: 24 },
]

export function ambientAt(hour: number): AmbientGrade {
  const h = normalizeHour(hour)

  let a = WRAPPED[0]
  let b = WRAPPED[WRAPPED.length - 1]
  for (let i = 0; i < WRAPPED.length - 1; i++) {
    if (h >= WRAPPED[i].hour && h < WRAPPED[i + 1].hour) {
      a = WRAPPED[i]
      b = WRAPPED[i + 1]
      break
    }
  }

  const span = b.hour - a.hour
  const t = span === 0 ? 0 : (h - a.hour) / span

  return {
    tint: rgbToHex(lerpRgb(hexToRgb(a.tint), hexToRgb(b.tint), t)),
    glow: rgbToHex(lerpRgb(hexToRgb(a.glow), hexToRgb(b.glow), t)),
    darkness: lerp(a.darkness, b.darkness, t),
  }
}

/**
 * Scene brightness 0..1, the inverse of ambient darkness. Compositors fade
 * point lights in as this drops (fully on below ~0.5).
 */
export function lightLevelAt(hour: number): number {
  return 1 - ambientAt(hour).darkness
}
