import type { PointLight } from './types.js'

function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

/**
 * Deterministic per-light, per-frame brightness multiplier around 1.0 for
 * flame flicker. Stays within ±(flicker * 0.25); reproducible — no
 * Math.random, so renders can be replayed and tested.
 */
export function flickerScale(light: PointLight, frame: number): number {
  const flicker = light.flicker ?? 0
  if (flicker <= 0) return 1
  const seed = hashId(light.id)
  // Two incommensurate waves give an organic waver instead of a pulse.
  const wave =
    Math.sin(frame * 0.9 + seed) * 0.6 +
    Math.sin(frame * 2.3 + seed * 0.31) * 0.4
  return 1 + wave * flicker * 0.25
}
