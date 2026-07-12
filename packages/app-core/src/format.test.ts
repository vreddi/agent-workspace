import { describe, expect, it } from 'vitest'
import {
  fmtDateBadge,
  formatCostDuration,
  formatDays,
  hashString,
  pick,
} from './format'

describe('hashString / pick', () => {
  it('hashString is deterministic and non-negative', () => {
    expect(hashString('abc')).toBe(hashString('abc'))
    expect(hashString('abc')).toBeGreaterThanOrEqual(0)
    expect(hashString('abc')).not.toBe(hashString('abd'))
  })

  it('pick returns a stable element for a key', () => {
    const arr = ['a', 'b', 'c', 'd'] as const
    expect(pick(arr, 'key')).toBe(pick(arr, 'key'))
    expect(arr).toContain(pick(arr, 'key'))
  })
})

describe('formatDays', () => {
  it('rounds to one decimal place', () => {
    expect(formatDays(2.25)).toBe('2.3')
    expect(formatDays(3)).toBe('3')
    expect(formatDays(0.04)).toBe('0')
  })
})

describe('formatCostDuration', () => {
  it('shows sub-hour costs in minutes', () => {
    expect(formatCostDuration(30 / (24 * 60))).toBe('30m')
    expect(formatCostDuration(1 / (24 * 60))).toBe('1m')
    expect(formatCostDuration(0)).toBe('0m')
  })

  it('shows under-a-day costs in hours', () => {
    expect(formatCostDuration(1 / 24)).toBe('1h')
    expect(formatCostDuration(0.5)).toBe('12h')
    expect(formatCostDuration(1.5 / 24)).toBe('1h 30m')
  })

  it('shows a day or more in days with one decimal', () => {
    expect(formatCostDuration(1)).toBe('1d')
    expect(formatCostDuration(2.5)).toBe('2.5d')
    expect(formatCostDuration(2.25)).toBe('2.3d')
  })
})

describe('fmtDateBadge', () => {
  it('returns a dash for null', () => {
    expect(fmtDateBadge(null)).toBe('—')
  })

  it('formats a 12-hour badge', () => {
    expect(fmtDateBadge(new Date(2026, 6, 4, 9, 30))).toBe('07/04  9:30 AM')
    expect(fmtDateBadge(new Date(2026, 6, 4, 0, 5))).toBe('07/04  12:05 AM')
    expect(fmtDateBadge(new Date(2026, 6, 4, 13, 0))).toBe('07/04  1:00 PM')
  })
})
