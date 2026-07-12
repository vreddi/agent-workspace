import { describe, expect, test } from 'vitest'
import { partitionForDayView } from './day'
import { toDisplayTask, type TaskLike } from './tasks'
import type { DayPlanFields } from './day'

type Raw = TaskLike & DayPlanFields

// 10:00 AM local on an arbitrary day — 14h of clock time left in the day.
const NOW = new Date(2026, 6, 12, 10, 0, 0)

let nextId = 0
function makeTask(overrides: Partial<Raw> & { title: string }): Raw {
  return {
    _id: `task_${nextId++}`,
    description: null,
    status: 'open',
    softDeadline: null,
    hardDeadline: null,
    estimateMinutes: null,
    assignees: [],
    ...overrides,
  }
}

function display(raws: Raw[]) {
  return raws.map((raw) => toDisplayTask(raw, NOW.getTime()))
}

function at(daysFromNow: number, hour = 23): number {
  const d = new Date(NOW)
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, 59, 0, 0)
  return d.getTime()
}

describe('partitionForDayView', () => {
  test('keeps undated, due-today, and overdue tasks on the chart', () => {
    const tasks = display([
      makeTask({ title: 'Anytime' }),
      makeTask({ title: 'Tonight', softDeadline: at(0) }),
      makeTask({ title: 'Late', softDeadline: at(-2) }),
    ])
    const { today, suggested, later } = partitionForDayView(tasks, NOW)
    expect(today.map((t) => t.title)).toEqual(['Anytime', 'Tonight', 'Late'])
    expect(suggested).toEqual([])
    expect(later).toEqual([])
  })

  test('future-dated tasks leave the chart', () => {
    const tasks = display([
      makeTask({ title: 'Tomorrow', softDeadline: at(1) }),
      makeTask({ title: 'Next year', softDeadline: at(300) }),
    ])
    const { today, suggested, later } = partitionForDayView(tasks, NOW)
    expect(today).toEqual([])
    expect(suggested).toEqual([])
    expect(later.map((t) => t.title)).toEqual(['Tomorrow', 'Next year'])
  })

  test('suggests a future task that may finish early and fits the day', () => {
    const tasks = display([
      makeTask({
        title: 'Peloton',
        softDeadline: at(2),
        allowEarlyCompletion: true,
        estimateMinutes: 45,
      }),
      makeTask({
        title: 'Not early',
        softDeadline: at(2),
        estimateMinutes: 45,
      }),
    ])
    const { suggested, later } = partitionForDayView(tasks, NOW)
    expect(suggested.map((t) => t.title)).toEqual(['Peloton'])
    expect(later.map((t) => t.title)).toEqual(['Not early'])
  })

  test('never suggests a task without a known cost', () => {
    const tasks = display([
      makeTask({
        title: 'Unsized',
        softDeadline: at(2),
        allowEarlyCompletion: true,
      }),
    ])
    const { suggested, later } = partitionForDayView(tasks, NOW)
    expect(suggested).toEqual([])
    expect(later.map((t) => t.title)).toEqual(['Unsized'])
  })

  test("today's committed cost shrinks the room for suggestions", () => {
    // 14h left in the day; today's task eats 13h, so only ≤1h fits.
    const tasks = display([
      makeTask({ title: 'Big today', estimateMinutes: 13 * 60 }),
      makeTask({
        title: 'Two hours',
        softDeadline: at(1),
        allowEarlyCompletion: true,
        estimateMinutes: 120,
      }),
      makeTask({
        title: 'Half hour',
        softDeadline: at(2),
        allowEarlyCompletion: true,
        estimateMinutes: 30,
      }),
    ])
    const { suggested, later } = partitionForDayView(tasks, NOW)
    expect(suggested.map((t) => t.title)).toEqual(['Half hour'])
    expect(later.map((t) => t.title)).toEqual(['Two hours'])
  })

  test('progress lowers remaining cost until a long task fits', () => {
    // A 16h book doesn't fit the 14h left…
    const untouched = display([
      makeTask({
        title: 'Book',
        softDeadline: at(30),
        allowEarlyCompletion: true,
        estimateMinutes: 16 * 60,
      }),
    ])
    expect(partitionForDayView(untouched, NOW).suggested).toEqual([])

    // …but at 50% progress only 8h remain, which does.
    const halfway = display([
      makeTask({
        title: 'Book',
        softDeadline: at(30),
        allowEarlyCompletion: true,
        estimateMinutes: 16 * 60,
        progressPercent: 50,
      }),
    ])
    expect(
      partitionForDayView(halfway, NOW).suggested.map((t) => t.title),
    ).toEqual(['Book'])
  })

  test('suggestions fill soonest-deadline first and consume capacity', () => {
    // 14h free; each candidate costs 8h, so only the sooner one fits.
    const tasks = display([
      makeTask({
        title: 'Sooner',
        softDeadline: at(1),
        allowEarlyCompletion: true,
        estimateMinutes: 8 * 60,
      }),
      makeTask({
        title: 'Later',
        softDeadline: at(3),
        allowEarlyCompletion: true,
        estimateMinutes: 8 * 60,
      }),
    ])
    const { suggested, later } = partitionForDayView(tasks, NOW)
    expect(suggested.map((t) => t.title)).toEqual(['Sooner'])
    expect(later.map((t) => t.title)).toEqual(['Later'])
  })
})
