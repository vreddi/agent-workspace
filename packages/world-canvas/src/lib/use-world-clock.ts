import * as React from 'react'

import {
  ambientAt,
  artMoodAt,
  createClock,
  lightLevelAt,
  phaseAt,
  shadowAt,
  tickClock,
} from '@worldkit/lighting'
import type {
  AmbientGrade,
  DayPhase,
  ShadowProjection,
} from '@worldkit/lighting'

const TICK_MS = 200

export type UseWorldClockOptions = {
  /** Starting hour in [0, 24). Default 12 (noon). */
  hour?: number
  /** Game-hours advanced per real second. Default `1/60` (1 hour / minute). */
  speed?: number
  /** Whether the clock advances on its own. Default true. */
  running?: boolean
}

export type WorldClockState = {
  hour: number
  phase: DayPhase
  artMood: 'day' | 'night'
  ambient: AmbientGrade
  shadow: ShadowProjection | null
  lightLevel: number
  /** Jump to a specific hour (also usable while running). */
  setHour: (hour: number) => void
  /** Pause or resume the clock. */
  setRunning: (running: boolean) => void
}

/**
 * A live day/night clock as React state. Advances on a ~200ms real-time
 * interval via {@link tickClock} (measuring elapsed wall-clock time so it
 * stays accurate across dropped frames), and derives the ambient grade, sun
 * shadow, phase, art mood, and scene brightness from the current hour.
 */
export function useWorldClock(options?: UseWorldClockOptions): WorldClockState {
  const [hour, setHourState] = React.useState(
    () => createClock({ hour: options?.hour, speed: options?.speed }).hour,
  )

  // The authoritative clock lives in a ref so the interval reads fresh values
  // without re-subscribing; React state mirrors just the hour for rendering.
  const clockRef = React.useRef(
    createClock({
      hour: options?.hour,
      speed: options?.speed,
      running: options?.running,
    }),
  )
  const lastTickRef = React.useRef(Date.now())

  React.useEffect(() => {
    lastTickRef.current = Date.now()
    const interval = window.setInterval(() => {
      const now = Date.now()
      const elapsedSeconds = (now - lastTickRef.current) / 1000
      lastTickRef.current = now
      const next = tickClock(clockRef.current, elapsedSeconds)
      clockRef.current = next
      setHourState(next.hour)
    }, TICK_MS)
    return () => window.clearInterval(interval)
  }, [])

  const setHour = React.useCallback((next: number) => {
    clockRef.current = { ...clockRef.current, hour: next }
    setHourState(clockRef.current.hour)
  }, [])

  const setRunning = React.useCallback((running: boolean) => {
    clockRef.current = { ...clockRef.current, running }
    lastTickRef.current = Date.now()
  }, [])

  return React.useMemo(
    () => ({
      hour,
      phase: phaseAt(hour),
      artMood: artMoodAt(hour),
      ambient: ambientAt(hour),
      shadow: shadowAt(hour),
      lightLevel: lightLevelAt(hour),
      setHour,
      setRunning,
    }),
    [hour, setHour, setRunning],
  )
}
