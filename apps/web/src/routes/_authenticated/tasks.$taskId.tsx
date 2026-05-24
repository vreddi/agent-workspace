import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { UserButton, useUser } from '@clerk/tanstack-react-start'
import { Button } from '@org/ui/components/button'
import { cn } from '@org/ui/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import { useEffect, useState, type FormEvent } from 'react'

export const Route = createFileRoute('/_authenticated/tasks/$taskId')({
  component: TaskDetailPage,
})

type TaskStatus = Doc<'tasks'>['status']

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
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

const DATE_FIELDS = new Set(['softDeadline', 'hardDeadline', 'completedAt'])

const FIELD_LABELS: Record<string, string> = {
  title: 'title',
  description: 'description',
  status: 'status',
  softDeadline: 'soft deadline',
  hardDeadline: 'hard deadline',
  estimateMinutes: 'estimate (minutes)',
  completedAt: 'completed at',
}

const INPUT_CLASSES = cn(
  'border-input bg-background flex h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

const TEXTAREA_CLASSES = cn(
  'border-input bg-background flex min-h-[96px] w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none',
  'placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
)

function TaskDetailPage() {
  const { user } = useUser()

  return (
    <main className="mx-auto max-w-2xl p-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Task</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? user?.id}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/tasks">Back to tasks</Link>
          </Button>
          <UserButton />
        </div>
      </header>

      <Authenticated>
        <TaskDetail />
      </Authenticated>
    </main>
  )
}

function TaskDetail() {
  const { taskId } = Route.useParams()
  const id = taskId as Id<'tasks'>
  const task = useQuery(api.tasks.get, { id })

  if (task === undefined) {
    return <p className="text-sm text-muted-foreground">Loading task…</p>
  }
  if (task === null) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Task not found, or you don't have access.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/tasks">Back to tasks</Link>
        </Button>
      </div>
    )
  }

  return <TaskEditor task={task} />
}

function TaskEditor({ task }: { task: Doc<'tasks'> }) {
  const navigate = useNavigate()
  const updateTask = useMutation(api.tasks.update)
  const removeTask = useMutation(api.tasks.remove)

  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [softDeadline, setSoftDeadline] = useState(
    msToDateTimeLocal(task.softDeadline),
  )
  const [hardDeadline, setHardDeadline] = useState(
    msToDateTimeLocal(task.hardDeadline),
  )
  const [estimateMinutes, setEstimateMinutes] = useState(
    task.estimateMinutes === null ? '' : String(task.estimateMinutes),
  )
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(task.title)
    setDescription(task.description)
    setStatus(task.status)
    setSoftDeadline(msToDateTimeLocal(task.softDeadline))
    setHardDeadline(msToDateTimeLocal(task.hardDeadline))
    setEstimateMinutes(
      task.estimateMinutes === null ? '' : String(task.estimateMinutes),
    )
  }, [
    task._id,
    task.title,
    task.description,
    task.status,
    task.softDeadline,
    task.hardDeadline,
    task.estimateMinutes,
    task.updatedAt,
  ])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    if (!trimmedTitle || !trimmedDescription) {
      setError('Title and description are required.')
      return
    }

    const patch: {
      id: Id<'tasks'>
      title?: string
      description?: string
      status?: TaskStatus
      softDeadline?: number | null
      hardDeadline?: number | null
      estimateMinutes?: number | null
    } = { id: task._id }

    if (trimmedTitle !== task.title) patch.title = trimmedTitle
    if (trimmedDescription !== task.description) {
      patch.description = trimmedDescription
    }
    if (status !== task.status) patch.status = status

    const nextSoft = dateTimeLocalToMs(softDeadline)
    if (nextSoft !== task.softDeadline) patch.softDeadline = nextSoft
    const nextHard = dateTimeLocalToMs(hardDeadline)
    if (nextHard !== task.hardDeadline) patch.hardDeadline = nextHard

    const trimmedEstimate = estimateMinutes.trim()
    const nextEstimate =
      trimmedEstimate === '' ? null : Number(trimmedEstimate)
    if (nextEstimate !== null && !Number.isFinite(nextEstimate)) {
      setError('Estimate must be a number.')
      return
    }
    if (nextEstimate !== task.estimateMinutes) {
      patch.estimateMinutes = nextEstimate
    }

    setSaving(true)
    setError(null)
    try {
      await updateTask(patch)
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    try {
      await removeTask({ id: task._id })
      await navigate({ to: '/tasks' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="space-y-4">
        <label className="block space-y-1 text-xs text-muted-foreground">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={INPUT_CLASSES}
          />
        </label>

        <label className="block space-y-1 text-xs text-muted-foreground">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={TEXTAREA_CLASSES}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className={INPUT_CLASSES}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>Estimate (minutes)</span>
            <input
              type="number"
              min={0}
              value={estimateMinutes}
              onChange={(e) => setEstimateMinutes(e.target.value)}
              className={INPUT_CLASSES}
            />
          </label>
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
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
          <div className="flex items-center gap-3">
            {savedAt && !saving && (
              <span className="text-xs text-muted-foreground">Saved</span>
            )}
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </form>

      <TaskHistory taskId={task._id} />
    </div>
  )
}

function TaskHistory({ taskId }: { taskId: Id<'tasks'> }) {
  const events = useQuery(api.tasks.history, { taskId })

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold tracking-tight">History</h2>
      {events === undefined ? (
        <p className="text-sm text-muted-foreground">Loading history…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No history yet.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <HistoryEntry key={event._id} event={event} />
          ))}
        </ul>
      )}
    </section>
  )
}

function HistoryEntry({
  event,
}: {
  event: Doc<'taskEvents'>
}) {
  const when = new Date(event._creationTime).toLocaleString()
  return (
    <li className="border-border space-y-2 rounded-lg border px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm">
          <span className="font-medium">User</span>{' '}
          <span className="text-muted-foreground">{event.kind} task</span>
        </p>
        <span className="text-xs text-muted-foreground">{when}</span>
      </div>
      {event.changes.length > 0 && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {event.changes.map((change, idx) => (
            <li key={`${event._id}-${idx}`}>
              <span className="text-foreground">
                {FIELD_LABELS[change.field] ?? change.field}
              </span>
              :{' '}
              <span>{formatChangeValue(change.field, change.before)}</span>{' '}
              → <span>{formatChangeValue(change.field, change.after)}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function formatChangeValue(field: string, raw: string | null): string {
  if (raw === null) return '∅'
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return raw
  }
  if (parsed === null) return '∅'
  if (DATE_FIELDS.has(field) && typeof parsed === 'number') {
    return new Date(parsed).toLocaleString()
  }
  if (field === 'status' && typeof parsed === 'string') {
    return STATUS_LABELS[parsed as TaskStatus] ?? parsed
  }
  if (typeof parsed === 'string') return parsed
  if (typeof parsed === 'number') return String(parsed)
  return JSON.stringify(parsed)
}

function msToDateTimeLocal(ms: number | null): string {
  if (ms === null) return ''
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

function dateTimeLocalToMs(value: string): number | null {
  if (!value) return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}
