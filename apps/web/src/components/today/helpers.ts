import type { Doc, Id } from '@convex/_generated/dataModel'
import type { TaskListItem } from '@convex/tasks'

export type Tone =
  | 'sand'
  | 'sage'
  | 'clay'
  | 'fog'
  | 'rose'
  | 'slate'
  | 'graphite'

export const TONE_LIST: ReadonlyArray<Exclude<Tone, 'graphite'>> = [
  'sand',
  'sage',
  'clay',
  'fog',
  'rose',
  'slate',
]

export const TONE_STYLES: Record<Tone, { bg: string; fg: string }> = {
  sand: { bg: 'linear-gradient(135deg,#ffd8b1,#f6a86b)', fg: '#7a3d10' },
  sage: { bg: 'linear-gradient(135deg,#c9eccc,#7cc78a)', fg: '#1f5a2e' },
  clay: { bg: 'linear-gradient(135deg,#ffc8b8,#f08f70)', fg: '#73291a' },
  fog: { bg: 'linear-gradient(135deg,#c5dafd,#7ea2f5)', fg: '#1c3a85' },
  rose: { bg: 'linear-gradient(135deg,#ffcde0,#f48cb5)', fg: '#7a1f47' },
  slate: { bg: 'linear-gradient(135deg,#d6d8ea,#9a9dc7)', fg: '#2e306b' },
  graphite: { bg: 'linear-gradient(135deg,#3a3d4a,#181a22)', fg: '#fafafa' },
}

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

const SOURCES: { kind: SourceKind; label: string }[] = [
  { kind: 'github', label: 'PR #842' },
  { kind: 'linear', label: 'TSK-318' },
  { kind: 'figma', label: 'Frame v3' },
  { kind: 'notion', label: 'Doc' },
  { kind: 'gmail', label: 'Inbox' },
  { kind: 'slack', label: 'Thread' },
]

export function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function pick<T>(arr: ReadonlyArray<T>, key: string, salt = 0): T {
  return arr[(hashString(key) + salt) % arr.length]
}

export function toneFor(key: string): Exclude<Tone, 'graphite'> {
  return pick(TONE_LIST, key)
}

export function sourceFor(key: string): { kind: SourceKind; label: string } {
  return pick(SOURCES, key)
}

export type DisplayAssignee = {
  userId: Id<'users'>
  name: string
  initials: string
  imageUrl: string | null
  tone: Exclude<Tone, 'graphite'>
}

export function toDisplayAssignees(
  assignees: TaskListItem['assignees'],
): DisplayAssignee[] {
  return assignees.map((a) => ({
    userId: a.userId,
    name: a.name && a.name.trim() !== '' ? a.name : a.email,
    initials: initialsFromName(a.name || a.email, '?'),
    imageUrl: a.imageUrl,
    tone: toneFor(a.userId),
  }))
}

export function aiSuggestionFor(task: Doc<'tasks'>): string {
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

export type DisplayTask = {
  id: string
  raw: TaskListItem
  title: string
  body: string | null
  deadline: Date | null
  overdue: boolean
  assignees: DisplayAssignee[]
  source: { kind: SourceKind; label: string } | null
  aiSuggestion: string
  fresh: boolean
}

export function deriveDeadline(task: Doc<'tasks'>): Date | null {
  const ms = task.hardDeadline ?? task.softDeadline
  return ms ? new Date(ms) : null
}

export function toDisplayTask(task: TaskListItem, now: number): DisplayTask {
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

export function initialsFromName(
  name: string | null | undefined,
  fallback = 'Y',
): string {
  if (!name) return fallback
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return fallback
  if (parts.length === 1) return parts[0][0]!.toUpperCase()
  return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function firstName(name: string | null | undefined): string {
  if (!name) return 'there'
  return name.trim().split(/\s+/)[0]!
}

export function fmtDateBadge(d: Date | null): string {
  if (!d) return '—'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  let hh = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  const ampm = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  return `${mm}/${dd}  ${hh}:${min} ${ampm}`
}

export function fmtCountdown(d: Date | null, now = Date.now()): string | null {
  if (!d) return null
  const diffMs = d.getTime() - now
  const abs = Math.abs(diffMs)
  const mins = Math.round(abs / 60000)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  if (hours < 24) return rem ? `${hours}h ${rem}m` : `${hours}h`
  const days = Math.floor(hours / 24)
  const hrem = hours % 24
  return hrem ? `${days}d ${hrem}h` : `${days}d`
}

export function greetingFor(
  hour: number,
  style: 'casual' | 'time-of-day',
): string {
  if (style === 'casual') return 'Hey'
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export const FILTER_IDS = ['all', 'overdue', 'soon', 'later'] as const
export type FilterId = (typeof FILTER_IDS)[number]

export function applyFilter(
  tasks: DisplayTask[],
  filter: FilterId,
  now: number,
): DisplayTask[] {
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

export function sortForToday(tasks: DisplayTask[]): DisplayTask[] {
  return [...tasks].sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
    if (!a.deadline && !b.deadline) return 0
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return a.deadline.getTime() - b.deadline.getTime()
  })
}
