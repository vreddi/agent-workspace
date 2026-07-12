const DAY_MS = 24 * 60 * 60 * 1000

export function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Whole days from today to `date` (negative = past). */
export function daysFromToday(date: Date): number {
  return Math.round((date.getTime() - startOfToday().getTime()) / DAY_MS)
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/** Compact due label: "Today", "Tomorrow", "3d overdue", "Thu, Jul 9". */
export function formatDue(date: Date): string {
  const days = daysFromToday(date)
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

export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
