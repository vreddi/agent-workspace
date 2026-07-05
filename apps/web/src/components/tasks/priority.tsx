import type { Doc } from '@convex/_generated/dataModel'
import { cn } from '@org/ui/lib/utils'

export type TaskPriority = NonNullable<Doc<'tasks'>['priority']>

/** Ordered most→least critical, the way pickers should list them. */
export const PRIORITY_ORDER: TaskPriority[] = ['high', 'medium', 'low']

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const BADGE_CLASSES: Record<TaskPriority, string> = {
  high: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
  medium:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  low: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[11px] font-medium',
        BADGE_CLASSES[priority],
        className,
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  )
}
