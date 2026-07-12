import { normalizeHour } from './phase.js'
import { type WorldClock } from './types.js'

/** One game hour per real minute. */
const DEFAULT_SPEED = 1 / 60

export function createClock(options?: {
  hour?: number
  speed?: number
  running?: boolean
}): WorldClock {
  return {
    hour: normalizeHour(options?.hour ?? 12),
    speed: options?.speed ?? DEFAULT_SPEED,
    running: options?.running ?? true,
  }
}

/**
 * Advance the clock by `elapsedSeconds`. Returns a NEW clock; the hour wraps
 * mod 24. When the clock is not running the returned clock has the same values.
 */
export function tickClock(
  clock: WorldClock,
  elapsedSeconds: number,
): WorldClock {
  if (!clock.running) {
    return { ...clock }
  }
  return {
    ...clock,
    hour: normalizeHour(clock.hour + clock.speed * elapsedSeconds),
  }
}
