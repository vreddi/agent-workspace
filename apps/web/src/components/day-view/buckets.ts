import type { DisplayTask } from '../today/helpers'

export type BucketId =
  | 'overdue'
  | 'early'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'anytime'

export type Bucket = {
  id: BucketId
  label: string
  hint: string
  tasks: DisplayTask[]
}

const BUCKET_ORDER: BucketId[] = [
  'overdue',
  'early',
  'morning',
  'midday',
  'afternoon',
  'evening',
  'night',
  'anytime',
]

const BUCKET_META: Record<BucketId, { label: string; hint: string }> = {
  overdue: { label: 'Overdue', hint: 'Clear these first' },
  early: { label: 'Early', hint: 'Before 9 AM' },
  morning: { label: 'Morning', hint: '9 AM – 12 PM' },
  midday: { label: 'Midday', hint: '12 – 2 PM' },
  afternoon: { label: 'Afternoon', hint: '2 – 5 PM' },
  evening: { label: 'Evening', hint: '5 – 8 PM' },
  night: { label: 'Night', hint: 'After 8 PM' },
  anytime: { label: 'Anytime today', hint: 'No fixed time' },
}

function bucketForTask(task: DisplayTask, _now: Date): BucketId {
  if (task.overdue) return 'overdue'
  if (!task.deadline) return 'anytime'
  // If deadline is on a different day, still place by hour-of-day in the day view.
  const hour = task.deadline.getHours()
  if (hour < 9) return 'early'
  if (hour < 12) return 'morning'
  if (hour < 14) return 'midday'
  if (hour < 17) return 'afternoon'
  if (hour < 20) return 'evening'
  return 'night'
}

export function bucketize(tasks: DisplayTask[], now: Date): Bucket[] {
  const map = new Map<BucketId, DisplayTask[]>()
  for (const t of tasks) {
    const id = bucketForTask(t, now)
    const list = map.get(id) ?? []
    list.push(t)
    map.set(id, list)
  }
  // Sort inside each bucket by deadline asc; tasks without deadlines drift to the end.
  for (const [id, list] of map) {
    list.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return a.deadline.getTime() - b.deadline.getTime()
    })
    map.set(id, list)
  }
  return BUCKET_ORDER.filter((id) => (map.get(id)?.length ?? 0) > 0).map(
    (id) => ({
      id,
      label: BUCKET_META[id].label,
      hint: BUCKET_META[id].hint,
      tasks: map.get(id)!,
    }),
  )
}

export function bucketTimeLabel(id: BucketId): string {
  return BUCKET_META[id].label
}
