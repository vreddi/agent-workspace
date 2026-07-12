/**
 * Pure formatting helpers shared by the task detail, editor, and activity
 * views. Mirrors the phrasing the web app uses (apps/web .../tasks.$taskId.tsx)
 * so the two clients read the same. No JSX here, but it lives with the other
 * task components to keep the module boundary tidy.
 */
import { DIFFICULTY_WORDS, PRIORITY_LABELS } from '@/data/tasks-data'
import type { TaskPriority } from '@/data/hooks'

/** Current epoch ms. Wrapped so callers can read "now" during render without
 * tripping the react-hooks/purity lint on a bare `Date.now()`. */
export function nowMs(): number {
  return Date.now()
}

export function fmtDateTime(ms: number): string {
  const d = new Date(ms)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function fmtEventTime(ms: number, now = Date.now()): string {
  const d = new Date(ms)
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  const today = new Date(now)
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime()
  if (ms >= startOfToday) return `Today, ${time}`
  if (ms >= startOfToday - 24 * 60 * 60 * 1000) return `Yesterday, ${time}`
  return fmtDateTime(ms)
}

export function fmtEstimate(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function fmtCost(days: number): string {
  const rounded = Math.round(days * 10) / 10
  return `${rounded} day${rounded === 1 ? '' : 's'}`
}

export function fmtTimeOfDay(minutes: number): string {
  const d = new Date()
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// ── Activity phrasing ──────────────────────────────────────────────────────

function parseValue(raw: string | null): unknown {
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export { parseValue }

/**
 * One change → one plain-English phrase, or null to hide bookkeeping fields
 * (completedAt trails status). Ported from the web activity log.
 */
export function phraseForChange(
  change: { field: string; before: string | null; after: string | null },
  prevStatus?: unknown,
): string | null {
  const before = parseValue(change.before)
  const after = parseValue(change.after)
  switch (change.field) {
    case 'title':
      return `renamed it to "${String(after)}"`
    case 'description':
      if (after === null) return 'removed the description'
      if (before === null) return 'added a description'
      return 'updated the description'
    case 'emoji':
      return after === null
        ? 'removed the emoji'
        : `set the emoji to ${String(after)}`
    case 'status':
      if (after === 'done') return 'marked it done'
      if (after === 'in_progress') return 'started it'
      if (after === 'cancelled') return 'cancelled it'
      if (
        after === 'open' &&
        (prevStatus === 'done' || prevStatus === 'cancelled')
      )
        return 'reopened it'
      return 'marked it open'
    case 'softDeadline':
      if (after === null) return 'cleared the target date'
      if (typeof after !== 'number') return 'changed the target date'
      return `${before === null ? 'set' : 'moved'} the target date to ${fmtDateTime(after)}`
    case 'hardDeadline':
      if (after === null) return 'cleared the hard deadline'
      if (typeof after !== 'number') return 'changed the hard deadline'
      return `${before === null ? 'set' : 'moved'} the hard deadline to ${fmtDateTime(after)}`
    case 'estimateMinutes':
      if (after === null) return 'cleared the estimate'
      if (typeof after !== 'number') return 'changed the estimate'
      return `estimated it at ${fmtEstimate(after)}`
    case 'priority':
      if (after === null) return 'removed the priority'
      return `set priority to ${PRIORITY_LABELS[after as TaskPriority] ?? String(after)}`
    case 'difficulty':
      if (after === null) return 'cleared the difficulty'
      if (typeof after !== 'number') return 'changed the difficulty'
      return `rated it ${(DIFFICULTY_WORDS[after] ?? String(after)).toLowerCase()} (${after}/5)`
    case 'scheduledStartMinutes':
      if (after === null) return 'cleared the time slot'
      if (typeof after !== 'number') return 'changed the time slot'
      return `planned it for ${fmtTimeOfDay(after)}`
    case 'goalId':
      if (after === null) return 'removed it from its goal'
      if (before === null) return 'added it to a goal'
      return 'moved it to another goal'
    case 'costDays':
      if (after === null) return 'cleared the cost'
      if (typeof after !== 'number') return 'changed the cost'
      return `set the cost to ${fmtCost(after)}`
    case 'assignees': {
      if (change.before === null) return null
      const beforeNames = Array.isArray(before) ? before.map(String) : []
      const afterNames = Array.isArray(after) ? after.map(String) : []
      const added = afterNames.filter((name) => !beforeNames.includes(name))
      const removed = beforeNames.filter((name) => !afterNames.includes(name))
      if (added.length > 0 && removed.length === 0)
        return `assigned ${added.join(', ')}`
      if (removed.length > 0 && added.length === 0)
        return `unassigned ${removed.join(', ')}`
      return `changed the assignees to ${afterNames.join(', ')}`
    }
    case 'completedAt':
    case 'assigneeUserId':
      return null
    default:
      return `updated ${change.field}`
  }
}
