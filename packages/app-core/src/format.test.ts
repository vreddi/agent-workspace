import { describe, expect, it } from 'vitest'
import { fmtDateBadge, formatDays, hashString, pick } from './format.js'

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
