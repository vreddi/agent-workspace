import { describe, expect, it } from 'vitest'
import {
  aiSuggestionFor,
  applyFilter,
  deriveDeadline,
  effectiveCostDays,
  estimateToMinutes,
  fmtEstimate,
  type TaskLike,
  minutesToEstimateParts,
  sortForToday,
  toDisplayTask,
} from './tasks'

const HOUR = 60 * 60 * 1000
const NOW = 1_000_000_000_000

function task(over: Partial<TaskLike> & { _id: string }): TaskLike {
  return {
    title: 'Task',
    description: null,
    status: 'open',
    assignees: [],
    ...over,
  }
}

describe('deriveDeadline', () => {
  it('prefers the hard deadline over the soft one', () => {
    expect(
      deriveDeadline({ hardDeadline: 5, softDeadline: 9 })?.getTime(),
    ).toBe(5)
    expect(deriveDeadline({ softDeadline: 9 })?.getTime()).toBe(9)
    expect(deriveDeadline({})).toBeNull()
    expect(
      deriveDeadline({ hardDeadline: null, softDeadline: null }),
    ).toBeNull()
  })
})

describe('effectiveCostDays', () => {
  it('prefers explicit costDays over the estimate', () => {
    expect(effectiveCostDays({ costDays: 2, estimateMinutes: 30 })).toBe(2)
  })

  it('falls back to the time estimate, converted to days', () => {
    expect(effectiveCostDays({ estimateMinutes: 720 })).toBe(0.5)
    expect(effectiveCostDays({ costDays: null, estimateMinutes: 45 })).toBe(
      45 / (24 * 60),
    )
  })

  it('is null when neither is set', () => {
    expect(effectiveCostDays({})).toBeNull()
    expect(
      effectiveCostDays({ costDays: null, estimateMinutes: null }),
    ).toBeNull()
  })
})

describe('aiSuggestionFor', () => {
  it('formats estimate-based suggestions', () => {
    expect(aiSuggestionFor({ estimateMinutes: 90, status: 'open' })).toBe(
      'Estimated 1h 30m of focus',
    )
    expect(aiSuggestionFor({ estimateMinutes: 120, status: 'open' })).toBe(
      'Estimated 2h of focus',
    )
    expect(aiSuggestionFor({ estimateMinutes: 20, status: 'open' })).toBe(
      'Estimated 20m of focus — block after standup',
    )
  })

  it('falls back to status-based copy', () => {
    expect(aiSuggestionFor({ status: 'in_progress' })).toBe(
      'In motion — finish before lunch',
    )
    expect(aiSuggestionFor({ status: 'open' })).toBe('Quick — under 15m')
  })
})

describe('toDisplayTask', () => {
  it('marks open tasks with a past deadline overdue', () => {
    const d = toDisplayTask(
      task({ _id: 'a', hardDeadline: NOW - HOUR, status: 'open' }),
      NOW,
    )
    expect(d.overdue).toBe(true)
    expect(d.deadline?.getTime()).toBe(NOW - HOUR)
  })

  it('never marks completed tasks overdue', () => {
    const d = toDisplayTask(
      task({ _id: 'a', hardDeadline: NOW - HOUR, status: 'done' }),
      NOW,
    )
    expect(d.overdue).toBe(false)
  })

  it('preserves the raw row type for callers', () => {
    const raw = task({ _id: 'a', title: 'Hello' })
    const d = toDisplayTask(raw, NOW)
    expect(d.raw).toBe(raw)
    expect(d.title).toBe('Hello')
  })
})

describe('sortForToday', () => {
  it('puts overdue first, then soonest deadline, undated last', () => {
    const mk = (id: string, deadline: number | null, status = 'open') =>
      toDisplayTask(task({ _id: id, hardDeadline: deadline, status }), NOW)
    const undated = mk('undated', null)
    const soon = mk('soon', NOW + HOUR)
    const later = mk('later', NOW + 5 * HOUR)
    const overdue = mk('overdue', NOW - HOUR)

    const sorted = sortForToday([undated, later, soon, overdue])
    expect(sorted.map((t) => t.id)).toEqual([
      'overdue',
      'soon',
      'later',
      'undated',
    ])
  })
})

describe('estimate units', () => {
  it('converts each unit to whole minutes', () => {
    expect(estimateToMinutes(45, 'minutes')).toBe(45)
    expect(estimateToMinutes(2, 'hours')).toBe(120)
    expect(estimateToMinutes(1.5, 'hours')).toBe(90)
    expect(estimateToMinutes(1, 'days')).toBe(1440)
    expect(estimateToMinutes(0.5, 'days')).toBe(720)
  })

  it('rounds fractional minutes to whole', () => {
    expect(estimateToMinutes(1.005, 'hours')).toBe(60)
  })

  it('reopens in the largest unit that divides evenly', () => {
    expect(minutesToEstimateParts(45)).toEqual({ value: 45, unit: 'minutes' })
    expect(minutesToEstimateParts(90)).toEqual({ value: 90, unit: 'minutes' })
    expect(minutesToEstimateParts(120)).toEqual({ value: 2, unit: 'hours' })
    expect(minutesToEstimateParts(1440)).toEqual({ value: 1, unit: 'days' })
    expect(minutesToEstimateParts(2880)).toEqual({ value: 2, unit: 'days' })
    expect(minutesToEstimateParts(0)).toEqual({ value: 0, unit: 'minutes' })
  })

  it('is a round trip through minutes and back', () => {
    for (const minutes of [15, 60, 90, 120, 1440, 2880]) {
      const { value, unit } = minutesToEstimateParts(minutes)
      expect(estimateToMinutes(value, unit)).toBe(minutes)
    }
  })
})

describe('fmtEstimate', () => {
  it('shows minutes under an hour', () => {
    expect(fmtEstimate(45)).toBe('45 min')
  })

  it('shows hours and minutes', () => {
    expect(fmtEstimate(90)).toBe('1h 30m')
    expect(fmtEstimate(120)).toBe('2h')
  })

  it('shows days for long estimates', () => {
    expect(fmtEstimate(1440)).toBe('1d')
    expect(fmtEstimate(1500)).toBe('1d 1h')
    expect(fmtEstimate(2880)).toBe('2d')
  })
})

describe('applyFilter', () => {
  const mk = (id: string, deadline: number | null, status = 'open') =>
    toDisplayTask(task({ _id: id, hardDeadline: deadline, status }), NOW)
  const overdue = mk('overdue', NOW - HOUR)
  const soon = mk('soon', NOW + HOUR)
  const later = mk('later', NOW + 12 * HOUR)
  const undated = mk('undated', null)
  const all = [overdue, soon, later, undated]

  it('all returns everything', () => {
    expect(applyFilter(all, 'all', NOW)).toHaveLength(4)
  })

  it('overdue keeps only overdue tasks', () => {
    expect(applyFilter(all, 'overdue', NOW).map((t) => t.id)).toEqual([
      'overdue',
    ])
  })

  it('soon keeps upcoming within six hours', () => {
    expect(applyFilter(all, 'soon', NOW).map((t) => t.id)).toEqual(['soon'])
  })

  it('later keeps undated and far-out tasks', () => {
    expect(applyFilter(all, 'later', NOW).map((t) => t.id)).toEqual([
      'later',
      'undated',
    ])
  })
})
