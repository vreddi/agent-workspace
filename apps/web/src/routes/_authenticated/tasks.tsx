import { api } from '@convex/_generated/api'
import type { Doc } from '@convex/_generated/dataModel'
import { UserButton, useUser } from '@clerk/tanstack-react-start'
import { Button } from '@org/ui/components/button'
import { cn } from '@org/ui/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import { useState, type FormEvent } from 'react'

export const Route = createFileRoute('/_authenticated/tasks')({
  component: TasksPage,
})

type TaskStatus = Doc<'tasks'>['status']
type StatusFilter = TaskStatus | 'all'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

const STATUS_PILL_CLASSES: Record<TaskStatus, string> = {
  open: 'bg-muted text-muted-foreground',
  in_progress: 'bg-primary/10 text-primary',
  done: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-destructive/10 text-destructive',
}

const INPUT_CLASSES = cn(
  'border-input bg-background flex h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

const TEXTAREA_CLASSES = cn(
  'border-input bg-background flex min-h-[72px] w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

function TasksPage() {
  const { user } = useUser()

  return (
    <main className="mx-auto max-w-2xl p-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? user?.id}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">Home</Link>
          </Button>
          <UserButton />
        </div>
      </header>

      <Authenticated>
        <TaskList />
      </Authenticated>
    </main>
  )
}

function TaskList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const tasks = useQuery(
    api.tasks.list,
    statusFilter === 'all' ? {} : { status: statusFilter },
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const isActive = filter.value === statusFilter
          return (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          )
        })}
      </div>

      <NewTaskForm />

      {tasks === undefined ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tasks yet. Add one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <TaskRow key={task._id} task={task} />
          ))}
        </ul>
      )}
    </div>
  )
}

function NewTaskForm() {
  const createTask = useMutation(api.tasks.create)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [softDeadline, setSoftDeadline] = useState('')
  const [hardDeadline, setHardDeadline] = useState('')
  const [estimateMinutes, setEstimateMinutes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    if (!trimmedTitle || !trimmedDescription) return

    const payload: {
      title: string
      description: string
      softDeadline?: number
      hardDeadline?: number
      estimateMinutes?: number
    } = {
      title: trimmedTitle,
      description: trimmedDescription,
    }
    const softMs = dateTimeLocalToMs(softDeadline)
    if (softMs !== null) payload.softDeadline = softMs
    const hardMs = dateTimeLocalToMs(hardDeadline)
    if (hardMs !== null) payload.hardDeadline = hardMs
    const estimate = estimateMinutes.trim()
    if (estimate !== '') {
      const n = Number(estimate)
      if (Number.isFinite(n) && n >= 0) payload.estimateMinutes = n
    }

    setSubmitting(true)
    setError(null)
    try {
      await createTask(payload)
      setTitle('')
      setDescription('')
      setSoftDeadline('')
      setHardDeadline('')
      setEstimateMinutes('')
      setShowDetails(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-border space-y-3 rounded-lg border p-4"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className={INPUT_CLASSES}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe the task"
        className={TEXTAREA_CLASSES}
      />

      {showDetails && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>Soft deadline</span>
            <input
              type="datetime-local"
              value={softDeadline}
              onChange={(e) => setSoftDeadline(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>Hard deadline</span>
            <input
              type="datetime-local"
              value={hardDeadline}
              onChange={(e) => setHardDeadline(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground sm:col-span-2">
            <span>Estimate (minutes)</span>
            <input
              type="number"
              min={0}
              value={estimateMinutes}
              onChange={(e) => setEstimateMinutes(e.target.value)}
              placeholder="e.g. 30"
              className={INPUT_CLASSES}
            />
          </label>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails((s) => !s)}
        >
          {showDetails ? 'Hide details' : 'Details'}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add task'}
        </Button>
      </div>
    </form>
  )
}

function TaskRow({ task }: { task: Doc<'tasks'> }) {
  const countdown = task.hardDeadline
    ? formatCountdown(task.hardDeadline)
    : null

  return (
    <li className="border-border rounded-lg border">
      <Link
        to="/tasks/$taskId"
        params={{ taskId: task._id }}
        className="hover:bg-muted/40 block rounded-lg px-4 py-3 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {task.title}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                  STATUS_PILL_CLASSES[task.status],
                )}
              >
                {STATUS_LABELS[task.status]}
              </span>
            </div>
            {task.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {task.description}
              </p>
            )}
          </div>
          {countdown && (
            <span
              className={cn(
                'shrink-0 text-xs tabular-nums',
                countdown.overdue
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
            >
              {countdown.label}
            </span>
          )}
        </div>
      </Link>
    </li>
  )
}

function dateTimeLocalToMs(value: string): number | null {
  if (!value) return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

function formatCountdown(deadlineMs: number): { label: string; overdue: boolean } {
  const diff = deadlineMs - Date.now()
  const overdue = diff < 0
  const abs = Math.abs(diff)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  let label: string
  if (abs >= day) {
    const days = Math.round(abs / day)
    label = `${days}d`
  } else if (abs >= hour) {
    const hours = Math.round(abs / hour)
    label = `${hours}h`
  } else {
    const minutes = Math.max(1, Math.round(abs / minute))
    label = `${minutes}m`
  }
  return {
    label: overdue ? `${label} overdue` : `due in ${label}`,
    overdue,
  }
}
