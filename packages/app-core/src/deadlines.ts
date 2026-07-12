// Shared date/deadline vocabulary for web and mobile. Pure, timezone-local.

export const DAY_MS = 24 * 60 * 60 * 1000

/** Local midnight for the day containing `now`. */
export function startOfToday(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Whole days from today to `date` (negative = past). */
export function daysFromToday(date: Date, now: Date = new Date()): number {
  return Math.round((date.getTime() - startOfToday(now).getTime()) / DAY_MS)
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** Compact due label: "Today", "Tomorrow", "3d overdue", "Thu, Jul 9". */
export function formatDue(date: Date, now: Date = new Date()): string {
  const days = daysFromToday(date, now)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 0) return `${-days}d overdue`
  return `${WEEKDAY[date.getDay()]}, ${MONTH[date.getMonth()]} ${date.getDate()}`
}

/** Long form for detail screens: "Thursday, July 9". */
export function formatDateLong(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/** Human countdown to (or since) `d`: "5m", "2h 10m", "3d 4h". */
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

/** Day-granularity deadline description for goals, e.g. "3 days left",
 * "Due today", "Overdue by 2 days". */
export function describeDeadline(
  deadline: number,
  now: number,
): { label: string; overdue: boolean } {
  if (deadline < now) {
    const over = Math.max(1, Math.ceil((now - deadline) / DAY_MS))
    return {
      label: `Overdue by ${over} day${over === 1 ? '' : 's'}`,
      overdue: true,
    }
  }
  const days = Math.ceil((deadline - now) / DAY_MS)
  if (days === 0) return { label: 'Due today', overdue: false }
  return { label: `${days} day${days === 1 ? '' : 's'} left`, overdue: false }
}
