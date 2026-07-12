// Day-view scoping: which tasks belong on today's chart, and which
// future-dated tasks are worth suggesting because their remaining cost fits
// the free time left in the day. Structural types only — no backend imports.

import {
  MINUTES_PER_COST_DAY,
  remainingCostDays,
  type DisplayTask,
  type TaskCostLike,
  type TaskLike,
  type TaskProgressLike,
} from './tasks'

/** Extra task fields the day partition reads beyond the base TaskLike. */
export interface DayPlanFields extends TaskCostLike, TaskProgressLike {
  allowEarlyCompletion?: boolean | null
}

export interface DayPartition<T> {
  /** Overdue, due today, or undated — the day chart proper. */
  today: T[]
  /** Future-dated tasks that may finish early and fit today's spare time. */
  suggested: T[]
  /** Future-dated tasks that didn't make the cut. */
  later: T[]
}

function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function remainingCostMinutes(task: DayPlanFields): number | null {
  const days = remainingCostDays(task)
  return days == null ? null : days * MINUTES_PER_COST_DAY
}

/** Split open tasks into today's chart and early-completion suggestions.
 *
 * A task belongs to today when it's overdue, due today, or has no deadline.
 * A future-dated task becomes a suggestion when it's flagged as OK to finish
 * early AND its remaining cost fits the day's free capacity: the clock time
 * left until midnight minus the remaining cost of everything already on
 * today's chart. Candidates are considered soonest-deadline first, and each
 * accepted suggestion consumes its cost from the remaining capacity. */
export function partitionForDayView<
  TRaw extends TaskLike & DayPlanFields,
  T extends DisplayTask<TRaw>,
>(tasks: T[], now: Date): DayPartition<T> {
  const today: T[] = []
  const future: T[] = []
  for (const task of tasks) {
    if (task.overdue || !task.deadline || sameLocalDay(task.deadline, now)) {
      today.push(task)
    } else {
      future.push(task)
    }
  }

  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  )
  let freeMinutes = (endOfDay.getTime() - now.getTime()) / 60_000
  for (const task of today) {
    freeMinutes -= remainingCostMinutes(task.raw) ?? 0
  }

  const suggested: T[] = []
  const later: T[] = []
  const candidates = [...future].sort(
    (a, b) => a.deadline!.getTime() - b.deadline!.getTime(),
  )
  for (const task of candidates) {
    const cost = task.raw.allowEarlyCompletion
      ? remainingCostMinutes(task.raw)
      : null
    if (cost !== null && cost > 0 && cost <= freeMinutes) {
      suggested.push(task)
      freeMinutes -= cost
    } else {
      later.push(task)
    }
  }
  return { today, suggested, later }
}
