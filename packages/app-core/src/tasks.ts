// Task view-model: deriving deadlines, overdue state, display rows, sorting,
// and filtering. Structural types only — no backend/Convex imports.

import { pick } from './format'
import {
  type AssigneeLike,
  type DisplayAssignee,
  toDisplayAssignees,
} from './people'

export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled'

export type SourceKind =
  | 'github'
  | 'gmail'
  | 'slack'
  | 'discord'
  | 'messenger'
  | 'teams'
  | 'figma'
  | 'linear'
  | 'notion'
  | 'ashby'
  | 'calendar'

export interface TaskSource {
  kind: SourceKind
  label: string
}

const SOURCES: ReadonlyArray<TaskSource> = [
  { kind: 'github', label: 'PR #842' },
  { kind: 'linear', label: 'TSK-318' },
  { kind: 'figma', label: 'Frame v3' },
  { kind: 'notion', label: 'Doc' },
  { kind: 'gmail', label: 'Inbox' },
  { kind: 'slack', label: 'Thread' },
]

/** Deterministic placeholder "source" chip for a stable key (e.g. a task id). */
export function sourceFor(key: string): TaskSource {
  return pick(SOURCES, key)
}

/** Fields needed to derive a task's effective deadline. */
export interface TaskDeadlineLike {
  hardDeadline?: number | null
  softDeadline?: number | null
}

/** Fields needed to synthesize an AI focus suggestion. */
export interface TaskSuggestionLike {
  estimateMinutes?: number | null
  status: string
}

/** Structural superset of a task list row accepted by the display helpers. */
export interface TaskLike extends TaskDeadlineLike, TaskSuggestionLike {
  _id: string
  title: string
  description: string | null
  assignees: ReadonlyArray<AssigneeLike>
}

/** Hard deadline wins over soft; null when neither is set. */
export function deriveDeadline(task: TaskDeadlineLike): Date | null {
  const ms = task.hardDeadline ?? task.softDeadline
  return ms ? new Date(ms) : null
}

/** Minutes in a cost "day". Cost and time estimates share this scale so a
 * task's time estimate can stand in as its effort cost. Mirrored inline in
 * convex/goals.ts (Convex can't import this package). */
export const MINUTES_PER_COST_DAY = 24 * 60

// ── Time estimates ──────────────────────────────────────────────────────────
// Estimates are stored canonically as whole minutes (tasks.estimateMinutes),
// but a person thinks in whichever unit is natural for the task. These helpers
// convert between that stored minute count and a {value, unit} pair the
// create/edit forms drive, and format it for display. A "day" here is the same
// 24h span as a cost day, so a "1 day" estimate reads as 1 day of cost too.

export type EstimateUnit = 'minutes' | 'hours' | 'days'

export const ESTIMATE_UNITS: readonly EstimateUnit[] = [
  'minutes',
  'hours',
  'days',
]

const MINUTES_PER_ESTIMATE_UNIT: Record<EstimateUnit, number> = {
  minutes: 1,
  hours: 60,
  days: MINUTES_PER_COST_DAY,
}

export const ESTIMATE_UNIT_LABELS: Record<EstimateUnit, string> = {
  minutes: 'minutes',
  hours: 'hours',
  days: 'days',
}

/** Convert a value in the given unit to whole minutes for storage. */
export function estimateToMinutes(value: number, unit: EstimateUnit): number {
  return Math.round(value * MINUTES_PER_ESTIMATE_UNIT[unit])
}

/** Split a stored minute count into the largest unit that divides it evenly,
 * so the editor reopens showing "2 hours" rather than "120 minutes". */
export function minutesToEstimateParts(minutes: number): {
  value: number
  unit: EstimateUnit
} {
  if (minutes > 0 && minutes % MINUTES_PER_COST_DAY === 0) {
    return { value: minutes / MINUTES_PER_COST_DAY, unit: 'days' }
  }
  if (minutes > 0 && minutes % 60 === 0) {
    return { value: minutes / 60, unit: 'hours' }
  }
  return { value: minutes, unit: 'minutes' }
}

/** Human-readable estimate: "45 min", "1h 30m", "2d 3h". */
export function fmtEstimate(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const days = Math.floor(minutes / MINUTES_PER_COST_DAY)
  const rem = minutes - days * MINUTES_PER_COST_DAY
  const h = Math.floor(rem / 60)
  const m = rem % 60
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  return parts.join(' ')
}

/** Fields that can supply a task's effort cost, in effect-order. */
export interface TaskCostLike {
  costDays?: number | null
  estimateMinutes?: number | null
}

/** A task's effort cost in days: the explicit `costDays` when set, otherwise
 * the time estimate converted to days. Null when the task has neither. */
export function effectiveCostDays(task: TaskCostLike): number | null {
  if (task.costDays != null) return task.costDays
  if (task.estimateMinutes != null)
    return task.estimateMinutes / MINUTES_PER_COST_DAY
  return null
}

export function aiSuggestionFor(task: TaskSuggestionLike): string {
  if (task.estimateMinutes && task.estimateMinutes > 0) {
    if (task.estimateMinutes >= 60) {
      const h = Math.floor(task.estimateMinutes / 60)
      const m = task.estimateMinutes % 60
      return `Estimated ${h}h${m ? ` ${m}m` : ''} of focus`
    }
    return `Estimated ${task.estimateMinutes}m of focus — block after standup`
  }
  if (task.status === 'in_progress') return 'In motion — finish before lunch'
  return 'Quick — under 15m'
}

export interface DisplayTask<TRaw extends TaskLike = TaskLike> {
  id: string
  raw: TRaw
  title: string
  body: string | null
  deadline: Date | null
  overdue: boolean
  assignees: DisplayAssignee[]
  source: TaskSource | null
  aiSuggestion: string
  fresh: boolean
}

export function toDisplayTask<TRaw extends TaskLike>(
  task: TRaw,
  now: number,
): DisplayTask<TRaw> {
  const deadline = deriveDeadline(task)
  const open = task.status === 'open' || task.status === 'in_progress'
  const overdue = !!(deadline && open && deadline.getTime() < now)
  return {
    id: task._id,
    raw: task,
    title: task.title,
    body: task.description,
    deadline,
    overdue,
    assignees: toDisplayAssignees(task.assignees),
    source: sourceFor(task._id),
    aiSuggestion: aiSuggestionFor(task),
    fresh: false,
  }
}

export const FILTER_IDS = ['all', 'overdue', 'soon', 'later'] as const
export type FilterId = (typeof FILTER_IDS)[number]

export function applyFilter<T extends DisplayTask>(
  tasks: T[],
  filter: FilterId,
  now: number,
): T[] {
  if (filter === 'all') return tasks
  if (filter === 'overdue') return tasks.filter((t) => t.overdue)
  const sixHrs = 6 * 60 * 60 * 1000
  if (filter === 'soon')
    return tasks.filter(
      (t) => t.deadline && !t.overdue && t.deadline.getTime() - now < sixHrs,
    )
  return tasks.filter(
    (t) => !t.deadline || (!t.overdue && t.deadline.getTime() - now >= sixHrs),
  )
}

/** Overdue first, then by soonest deadline; undated tasks sink to the bottom. */
export function sortForToday<T extends DisplayTask>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
    if (!a.deadline && !b.deadline) return 0
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return a.deadline.getTime() - b.deadline.getTime()
  })
}
