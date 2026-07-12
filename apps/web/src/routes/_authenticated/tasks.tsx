import { api } from '@convex/_generated/api'
import type { Doc } from '@convex/_generated/dataModel'
import type { TaskListItem } from '@convex/tasks'
import { cn } from '@org/ui/lib/utils'
import {
  createFileRoute,
  Link,
  Outlet,
  useChildMatches,
} from '@tanstack/react-router'
import { Authenticated, useQuery } from 'convex/react'
import { useMemo, useState } from 'react'
import type { Id } from '@convex/_generated/dataModel'
import { AssigneeStack } from '~/components/tasks/assignees'
import { PriorityBadge } from '~/components/tasks/priority'
import { AppShell } from '~/components/today/app-shell'
import {
  fmtCountdown,
  fmtDateBadge,
  sortForToday,
  toDisplayTask,
} from '~/components/today/helpers'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TasksRoute,
})

// /tasks/$taskId nests under this route; without deferring to the Outlet the
// detail page (which renders its own shell) would never show.
function TasksRoute() {
  const childMatches = useChildMatches()
  if (childMatches.length > 0) return <Outlet />
  return <TasksPage />
}

function TasksPage() {
  return (
    <AppShell active="tasks">
      <div className="t-page-head">
        <h1>Tasks</h1>
      </div>
      <main className="px-3 pb-16 pt-4">
        <Authenticated>
          <TasksList />
        </Authenticated>
      </main>
    </AppShell>
  )
}

type TaskStatus = Doc<'tasks'>['status']
type StatusFilter = TaskStatus | 'all'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_PILL: Record<TaskStatus, { label: string; className: string }> = {
  open: {
    label: 'Open',
    className:
      'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  in_progress: {
    label: 'In progress',
    className:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300',
  },
  done: {
    label: 'Done',
    className:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'border-muted bg-muted text-muted-foreground dark:border-muted dark:bg-muted',
  },
}

function TasksList() {
  const [status, setStatus] = useState<StatusFilter>('open')
  const me = useQuery(api.users.current)
  const tasks = useQuery(api.tasks.list, status === 'all' ? {} : { status })

  const now = Date.now()
  const sorted = useMemo(() => {
    if (!tasks) return undefined
    return sortForToday(tasks.map((task) => toDisplayTask(task, now)))
  }, [tasks, now])

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex flex-wrap rounded-lg border p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                'rounded-md px-3 py-1 text-sm transition',
                status === f.value
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {sorted === undefined ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[64px] animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState status={status} />
      ) : (
        <div className="space-y-2.5">
          {sorted.map((task) => (
            <TaskRow
              key={task.id}
              task={task.raw}
              now={now}
              viewerId={me?._id ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ status }: { status: StatusFilter }) {
  const label =
    status === 'all'
      ? 'tasks'
      : STATUS_PILL[status].label.toLowerCase() + ' tasks'
  if (status !== 'all') {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No {label} right now.</p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
        ✓
      </div>
      <h2 className="mb-1 text-base font-semibold">No tasks yet</h2>
      <p className="mx-auto max-w-sm text-sm text-muted-foreground">
        Capture a task with the <span className="font-medium">New task</span>{' '}
        button (or press <span className="font-medium">N</span>) and it will
        show up here.
      </p>
    </div>
  )
}

function TaskRow({
  task,
  now,
  viewerId,
}: {
  task: TaskListItem
  now: number
  viewerId: Id<'users'> | null
}) {
  const display = toDisplayTask(task, now)
  const cd = display.deadline ? fmtCountdown(display.deadline, now) : null
  const pill = STATUS_PILL[task.status]
  // Avatars only when the task involves someone besides you; the common
  // solo case stays quiet.
  const shared =
    task.assignees.length > 1 ||
    task.assignees.some((a) => viewerId !== null && a.userId !== viewerId)

  return (
    <Link
      to="/tasks/$taskId"
      params={{ taskId: task._id }}
      className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition hover:border-ring hover:shadow-sm"
    >
      {task.emoji ? (
        <span className="shrink-0 text-xl leading-none" aria-hidden>
          {task.emoji}
        </span>
      ) : (
        <span
          className={cn(
            'size-2.5 shrink-0 rounded-full',
            display.overdue ? 'bg-destructive' : 'bg-muted-foreground/40',
          )}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium leading-tight">
            {task.title}
          </span>
          {task.priority && <PriorityBadge priority={task.priority} />}
        </div>
        {display.deadline && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {fmtDateBadge(display.deadline)}
            {cd && (
              <span
                className={cn(
                  display.overdue && 'font-medium text-destructive',
                )}
              >
                {' · '}
                {display.overdue ? `${cd} late` : `in ${cd}`}
              </span>
            )}
          </div>
        )}
      </div>
      {shared && (
        <span className="shrink-0" aria-label="Shared task">
          <AssigneeStack assignees={task.assignees} />
        </span>
      )}
      <span
        className={cn(
          'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium',
          pill.className,
        )}
      >
        {pill.label}
      </span>
    </Link>
  )
}
