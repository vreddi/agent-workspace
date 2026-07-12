import { describe, expect, it } from 'vitest'
import {
  DAY_MS,
  daysFromToday,
  describeDeadline,
  fmtCountdown,
  formatDue,
  startOfToday,
} from './deadlines.js'

const NOON = new Date(2026, 6, 11, 12, 0, 0) // 2026-07-11, local noon

describe('startOfToday', () => {
  it('zeroes the time to local midnight', () => {
    const start = startOfToday(NOON)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getDate()).toBe(11)
  })
})

describe('daysFromToday', () => {
  it('is 0 for later the same day and 1 for tomorrow', () => {
    expect(daysFromToday(new Date(2026, 6, 11, 9, 0), NOON)).toBe(0)
    expect(daysFromToday(new Date(2026, 6, 12, 9, 0), NOON)).toBe(1)
  })

  it('is negative for past days', () => {
    expect(daysFromToday(new Date(2026, 6, 8), NOON)).toBe(-3)
  })
})

describe('formatDue', () => {
  it('labels relative days', () => {
    expect(formatDue(new Date(2026, 6, 11, 6, 0), NOON)).toBe('Today')
    expect(formatDue(new Date(2026, 6, 12, 6, 0), NOON)).toBe('Tomorrow')
    expect(formatDue(new Date(2026, 6, 8, 6, 0), NOON)).toBe('3d overdue')
  })

  it('falls back to a weekday/month label further out', () => {
    // 2026-07-16 is a Thursday.
    expect(formatDue(new Date(2026, 6, 16, 9, 0), NOON)).toBe('Thu, Jul 16')
  })
})

describe('fmtCountdown', () => {
  const now = 0
  it('returns null without a date', () => {
    expect(fmtCountdown(null, now)).toBeNull()
  })

  it('formats minutes, hours, and days', () => {
    expect(fmtCountdown(new Date(5 * 60_000), now)).toBe('5m')
    expect(fmtCountdown(new Date(2 * 3600_000 + 10 * 60_000), now)).toBe(
      '2h 10m',
    )
    expect(fmtCountdown(new Date(3 * DAY_MS), now)).toBe('3d')
    expect(fmtCountdown(new Date(3 * DAY_MS + 4 * 3600_000), now)).toBe('3d 4h')
  })

  it('is symmetric for past deadlines (absolute value)', () => {
    expect(fmtCountdown(new Date(-90 * 60_000), now)).toBe('1h 30m')
  })
})

describe('describeDeadline', () => {
  const now = new Date(2026, 6, 11, 12, 0).getTime()
  it('reports days left and due-today', () => {
    expect(describeDeadline(now + 3 * DAY_MS, now)).toEqual({
      label: '3 days left',
      overdue: false,
    })
    expect(describeDeadline(now, now)).toEqual({
      label: 'Due today',
      overdue: false,
    })
  })

  it('reports overdue with pluralization', () => {
    expect(describeDeadline(now - DAY_MS, now)).toEqual({
      label: 'Overdue by 1 day',
      overdue: true,
    })
    expect(describeDeadline(now - 2 * DAY_MS, now)).toEqual({
      label: 'Overdue by 2 days',
      overdue: true,
    })
  })
})
