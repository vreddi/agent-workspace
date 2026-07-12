import {
  DAWN_START,
  DAY_START,
  DUSK_START,
  NIGHT_START,
  type DayPhase,
} from './types.js'

/** Normalize an hour float into [0, 24), handling negatives. */
export function normalizeHour(hour: number): number {
  return ((hour % 24) + 24) % 24
}

export function phaseAt(hour: number): DayPhase {
  const h = normalizeHour(hour)
  if (h >= DAWN_START && h < DAY_START) return 'dawn'
  if (h >= DAY_START && h < DUSK_START) return 'day'
  if (h >= DUSK_START && h < NIGHT_START) return 'dusk'
  return 'night'
}

/** Which baked tile palette to use at this hour. */
export function artMoodAt(hour: number): 'day' | 'night' {
  const h = normalizeHour(hour)
  return h >= 6.5 && h < 18.5 ? 'day' : 'night'
}
