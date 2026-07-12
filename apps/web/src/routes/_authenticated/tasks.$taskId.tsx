import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import type { TaskDetail, TaskHistoryEvent } from '@convex/tasks'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@org/ui/components/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@org/ui/components/select'
import { Slider } from '@org/ui/components/slider'
import { cn } from '@org/ui/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import { Component, useState, type FormEvent, type ReactNode } from 'react'
import {
  goalTypeValue,
  GoalTypeSelectionIcon,
} from '~/components/goals/goal-ui'
import { TaskPeopleSection } from '~/components/tasks/assignees'
import {
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  type TaskPriority,
} from '~/components/tasks/priority'
import { taskDetailStyles } from '~/components/tasks/styles'
import { AppShell } from '~/components/today/app-shell'
import { AppBreadcrumbs, type AppCrumb } from '~/components/today/breadcrumbs'
import { EmojiGlyphButton } from '~/components/today/emoji-picker'

export const Route = createFileRoute('/_authenticated/tasks/$taskId')({
  component: TaskDetailPage,
})

type TaskStatus = Doc<'tasks'>['status']

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const DIFFICULTY_WORDS: Record<number, string> = {
  1: 'Very easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Hard',
  5: 'Challenging',
}

// ── Formatting ──────────────────────────────────────────────

function fmtDateTime(ms: number): string {
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

function fmtEventTime(ms: number, now = Date.now()): string {
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

function fmtEstimate(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function fmtCost(days: number): string {
  const rounded = Math.round(days * 10) / 10
  return `${rounded} day${rounded === 1 ? '' : 's'}`
}

function fmtTimeOfDay(minutes: number): string {
  const d = new Date()
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
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

function minutesToTimeInput(minutes: number | null): string {
  if (minutes === null) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

function timeInputToMinutes(value: string): number | null {
  if (!value) return null
  const [h, m] = value.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return (h ?? 0) * 60 + (m ?? 0)
}

// ── Page shell ──────────────────────────────────────────────

// api.tasks.get throws (instead of returning null) when the task is missing
// or not yours — e.g. right after deleting it. Catch that and show a
// friendly dead end instead of the router's error page.
class TaskErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="tdp-deadend">
          <h2>Task not found</h2>
          <p>It may have been deleted, or you don't have access.</p>
          <Link to="/app" className="tdp-btn">
            Back to Today
          </Link>
        </div>
      )
    }
    return this.props.children
  }
}

function TaskDetailPage() {
  return (
    <AppShell>
      <style>{taskDetailStyles}</style>
      <main className="tdp">
        <Authenticated>
          <TaskErrorBoundary>
            <TaskLoader />
          </TaskErrorBoundary>
        </Authenticated>
      </main>
    </AppShell>
  )
}

function TaskLoader() {
  const { taskId } = Route.useParams()
  const task = useQuery(api.tasks.get, { id: taskId as Id<'tasks'> })

  if (task === undefined) {
    return (
      <div className="tdp-skeleton" aria-hidden>
        <div style={{ height: 46, width: 46, borderRadius: 13 }} />
        <div style={{ height: 26, width: '55%' }} />
        <div style={{ height: 14, width: '35%' }} />
        <div style={{ height: 96, width: '100%', marginTop: 18 }} />
      </div>
    )
  }
  return <TaskView task={task} />
}

// ── Read view ───────────────────────────────────────────────

function TaskView({ task }: { task: TaskDetail }) {
  const navigate = useNavigate()
  const updateTask = useMutation(api.tasks.update)
  const removeTask = useMutation(api.tasks.remove)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function setStatus(status: TaskStatus) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await updateTask({ id: task._id, status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task? This cannot be undone.')) return
    setBusy(true)
    setError(null)
    try {
      await removeTask({ id: task._id })
      await navigate({ to: '/app' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      setBusy(false)
    }
  }

  // A task inside a goal lives under that goal; a loose task hangs off
  // Today. The trail mirrors that hierarchy, not browsing history.
  const crumbs: AppCrumb[] = task.goal
    ? [
        { label: 'Goals', to: '/goals' },
        {
          label: task.goal.title,
          to: '/goals/$goalId',
          params: { goalId: task.goal._id },
        },
        { label: task.title },
      ]
    : [{ label: 'Today', to: '/app' }, { label: task.title }]

  if (editing) {
    return (
      <>
        <AppBreadcrumbs items={crumbs} />
        <TaskEditForm task={task} onClose={() => setEditing(false)} />
        <ActivitySection taskId={task._id} />
      </>
    )
  }

  const open = task.status === 'open' || task.status === 'in_progress'
  const deadline = task.hardDeadline ?? task.softDeadline
  const overdue = open && deadline !== null && deadline < Date.now()

  return (
    <>
      <AppBreadcrumbs items={crumbs} />
      <div className="tdp-head">
        {task.emoji && (
          <div className="tdp-emoji" aria-hidden>
            {task.emoji}
          </div>
        )}
        <div className="tdp-head__text">
          <h1
            className={cn(
              'tdp-title',
              task.status === 'done' && 'tdp-title--done',
            )}
          >
            {task.title}
          </h1>
          <div className="tdp-meta">
            <span className="tdp-status">
              <span
                className={cn(
                  'tdp-status__dot',
                  task.status !== 'open' && `tdp-status__dot--${task.status}`,
                )}
              />
              {STATUS_LABELS[task.status]}
            </span>
            {task.status === 'done' && task.completedAt !== null && (
              <>
                <span className="t-dot-tiny" />
                <span className="tdp-meta__done">
                  finished {fmtEventTime(task.completedAt)}
                </span>
              </>
            )}
            {open && deadline !== null && (
              <>
                <span className="t-dot-tiny" />
                {overdue ? (
                  <span className="tdp-meta__overdue">
                    was due {fmtDateTime(deadline)}
                  </span>
                ) : (
                  <span>due {fmtDateTime(deadline)}</span>
                )}
              </>
            )}
            {task.estimateMinutes !== null && (
              <>
                <span className="t-dot-tiny" />
                <span>{fmtEstimate(task.estimateMinutes)}</span>
              </>
            )}
            {task.priority != null && (
              <>
                <span className="t-dot-tiny" />
                <span>{PRIORITY_LABELS[task.priority]} priority</span>
              </>
            )}
          </div>
          {task.goal && (
            <Link
              to="/goals/$goalId"
              params={{ goalId: task.goal._id }}
              className="tdp-goal"
            >
              <GoalTypeSelectionIcon
                value={goalTypeValue(task.goal)}
                size={32}
              />
              <span className="tdp-goal__text">
                <span className="tdp-goal__label">Part of goal</span>
                <span className="tdp-goal__title">{task.goal.title}</span>
              </span>
              <svg
                className="tdp-goal__arrow"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          )}
          {task.description && <p className="tdp-desc">{task.description}</p>}
        </div>
        <div className="tdp-actions">
          {open ? (
            <button
              type="button"
              className="tdp-btn tdp-btn--primary"
              disabled={busy}
              onClick={() => {
                void setStatus('done')
              }}
            >
              Mark done
            </button>
          ) : (
            <button
              type="button"
              className="tdp-btn"
              disabled={busy}
              onClick={() => {
                void setStatus('open')
              }}
            >
              Reopen
            </button>
          )}
          <button
            type="button"
            className="tdp-btn"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          {(open || task.viewerIsCreator) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="tdp-btn tdp-btn--icon"
                  aria-label="More actions"
                >
                  ⋯
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {task.status === 'open' && (
                  <DropdownMenuItem
                    onSelect={() => {
                      void setStatus('in_progress')
                    }}
                  >
                    Mark in progress
                  </DropdownMenuItem>
                )}
                {open && (
                  <DropdownMenuItem
                    onSelect={() => {
                      void setStatus('cancelled')
                    }}
                  >
                    Cancel task
                  </DropdownMenuItem>
                )}
                {open && task.viewerIsCreator && <DropdownMenuSeparator />}
                {task.viewerIsCreator && (
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => {
                      void handleDelete()
                    }}
                  >
                    Delete task
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {error && (
        <p className="tdp-form__error" style={{ margin: '14px 0 0' }}>
          {error}
        </p>
      )}

      <DetailsSection task={task} />
      <TaskPeopleSection
        taskId={task._id}
        assignees={task.assignees}
        creatorId={task.creatorId}
        viewerId={task.viewerId}
      />
      <ActivitySection taskId={task._id} />
    </>
  )
}

function DetailsSection({ task }: { task: TaskDetail }) {
  const rows: { label: string; value: ReactNode; overdue?: boolean }[] = []
  const open = task.status === 'open' || task.status === 'in_progress'
  const now = Date.now()

  if (task.priority != null) {
    rows.push({ label: 'Priority', value: PRIORITY_LABELS[task.priority] })
  }
  if (task.difficulty != null) {
    rows.push({
      label: 'Difficulty',
      value: (
        <>
          {DIFFICULTY_WORDS[task.difficulty] ?? task.difficulty}{' '}
          <span className="tdp-details__hint">({task.difficulty}/5)</span>
        </>
      ),
    })
  }
  if (task.estimateMinutes !== null) {
    rows.push({ label: 'Estimate', value: fmtEstimate(task.estimateMinutes) })
  }
  if (task.costDays != null) {
    rows.push({
      label: 'Cost',
      value: (
        <>
          {fmtCost(task.costDays)}{' '}
          <span className="tdp-details__hint">counts toward goal totals</span>
        </>
      ),
    })
  }
  if (task.softDeadline !== null) {
    rows.push({
      label: 'Target date',
      value: fmtDateTime(task.softDeadline),
      overdue: open && task.softDeadline < now,
    })
  }
  if (task.hardDeadline !== null) {
    rows.push({
      label: 'Hard deadline',
      value: fmtDateTime(task.hardDeadline),
      overdue: open && task.hardDeadline < now,
    })
  }
  if (task.scheduledStartMinutes != null) {
    const start = fmtTimeOfDay(task.scheduledStartMinutes)
    const end =
      task.estimateMinutes !== null
        ? fmtTimeOfDay(
            (task.scheduledStartMinutes + task.estimateMinutes) % (24 * 60),
          )
        : null
    rows.push({
      label: 'Time slot',
      value: end ? `${start} – ${end}` : start,
    })
  }

  return (
    <section className="tdp-section">
      <div className="tdp-section__head">
        <h2>Details</h2>
      </div>
      {rows.length === 0 ? (
        <p className="tdp-empty">
          No planning details yet. Edit the task to add a deadline, estimate, or
          priority.
        </p>
      ) : (
        <dl className="tdp-details">
          {rows.map((row) => (
            <div key={row.label} className="tdp-details__row">
              <dt>{row.label}</dt>
              <dd className={cn(row.overdue && 'tdp-details__overdue')}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

// ── Activity ────────────────────────────────────────────────

function parseValue(raw: string | null): unknown {
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

// One change → one plain-English phrase, or null to hide bookkeeping
// fields (completedAt trails status).
function phraseForChange(
  change: TaskHistoryEvent['changes'][number],
  prevStatus?: unknown,
): string | null {
  const before = parseValue(change.before)
  const after = parseValue(change.after)
  switch (change.field) {
    case 'title':
      return `renamed it to “${String(after)}”`
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
      // Creation events carry the initial set; the "created this task" lead
      // already covers that.
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

function ActivityItem({ event }: { event: TaskHistoryEvent }) {
  const actor = event.actorIsYou ? 'You' : event.actorName
  const when = fmtEventTime(event._creationTime)

  let lead: string
  let phrases: string[] = []
  if (event.kind === 'created') {
    lead = 'created this task'
  } else if (event.kind === 'deleted') {
    lead = 'deleted this task'
  } else {
    const statusChange = event.changes.find((c) => c.field === 'status')
    phrases = event.changes
      .map((c) => phraseForChange(c, parseValue(statusChange?.before ?? null)))
      .filter((p): p is string => p !== null)
    if (phrases.length === 0) {
      lead = 'updated this task'
    } else if (phrases.length === 1) {
      lead = phrases[0]!
      phrases = []
    } else {
      lead = `made ${phrases.length} changes`
    }
  }

  return (
    <li className="tdp-log__item">
      <span
        className={cn(
          'tdp-log__dot',
          event.kind === 'created' && 'tdp-log__dot--created',
        )}
        aria-hidden
      />
      <div className="tdp-log__body">
        <p className="tdp-log__line">
          <strong>{actor}</strong> {lead}
        </p>
        {phrases.length > 0 && (
          <ul className="tdp-log__changes">
            {phrases.map((phrase, idx) => (
              <li key={idx}>{phrase}</li>
            ))}
          </ul>
        )}
      </div>
      <span className="tdp-log__time">{when}</span>
    </li>
  )
}

function ActivitySection({ taskId }: { taskId: Id<'tasks'> }) {
  const events = useQuery(api.tasks.history, { taskId })

  return (
    <section className="tdp-section">
      <div className="tdp-section__head">
        <h2>Activity</h2>
        {events !== undefined && events.length > 0 && (
          <span className="tdp-section__count">{events.length}</span>
        )}
      </div>
      {events === undefined ? (
        <div className="tdp-skeleton" aria-hidden>
          <div style={{ height: 16, width: '70%' }} />
          <div style={{ height: 16, width: '50%' }} />
        </div>
      ) : events.length === 0 ? (
        <p className="tdp-empty">Nothing has happened here yet.</p>
      ) : (
        <ol className="tdp-log">
          {events.map((event) => (
            <ActivityItem key={event._id} event={event} />
          ))}
        </ol>
      )}
    </section>
  )
}

// ── Edit mode ───────────────────────────────────────────────

const NO_GOAL = '__none__'

function TaskEditForm({
  task,
  onClose,
}: {
  task: TaskDetail
  onClose: () => void
}) {
  const updateTask = useMutation(api.tasks.update)
  const goals = useQuery(api.goals.list, { status: 'active' })

  const [title, setTitle] = useState(task.title)
  const [emoji, setEmoji] = useState<string | null>(task.emoji ?? null)
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority | null>(
    task.priority ?? null,
  )
  const [difficulty, setDifficulty] = useState<number | null>(
    task.difficulty ?? null,
  )
  const [estimateMinutes, setEstimateMinutes] = useState(
    task.estimateMinutes === null ? '' : String(task.estimateMinutes),
  )
  const [softDeadline, setSoftDeadline] = useState(
    msToDateTimeLocal(task.softDeadline),
  )
  const [hardDeadline, setHardDeadline] = useState(
    msToDateTimeLocal(task.hardDeadline),
  )
  const [scheduledStart, setScheduledStart] = useState(
    minutesToTimeInput(task.scheduledStartMinutes ?? null),
  )
  const [goalId, setGoalId] = useState<string>(task.goalId ?? NO_GOAL)
  const [costDays, setCostDays] = useState(
    task.costDays == null ? '' : String(task.costDays),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The active-goals list won't include this task's goal if it's achieved
  // or archived; keep it selectable so opening the editor doesn't lose it.
  const goalOptions: { _id: Id<'goals'>; title: string }[] = (goals ?? []).map(
    (goal) => ({ _id: goal._id, title: goal.title }),
  )
  if (task.goal && !goalOptions.some((g) => g._id === task.goal!._id)) {
    goalOptions.unshift({ _id: task.goal._id, title: task.goal.title })
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('A title is required.')
      return
    }

    const patch: {
      id: Id<'tasks'>
      title?: string
      description?: string | null
      emoji?: string | null
      status?: TaskStatus
      softDeadline?: number | null
      hardDeadline?: number | null
      estimateMinutes?: number | null
      priority?: TaskPriority | null
      difficulty?: number | null
      scheduledStartMinutes?: number | null
      goalId?: Id<'goals'> | null
      costDays?: number | null
    } = { id: task._id }

    if (trimmedTitle !== task.title) patch.title = trimmedTitle
    const nextDescription =
      description.trim() === '' ? null : description.trim()
    if (nextDescription !== task.description)
      patch.description = nextDescription
    if (emoji !== (task.emoji ?? null)) patch.emoji = emoji
    if (status !== task.status) patch.status = status

    const nextSoft = dateTimeLocalToMs(softDeadline)
    if (nextSoft !== task.softDeadline) patch.softDeadline = nextSoft
    const nextHard = dateTimeLocalToMs(hardDeadline)
    if (nextHard !== task.hardDeadline) patch.hardDeadline = nextHard

    const trimmedEstimate = estimateMinutes.trim()
    const nextEstimate = trimmedEstimate === '' ? null : Number(trimmedEstimate)
    if (
      nextEstimate !== null &&
      (!Number.isFinite(nextEstimate) || nextEstimate < 0)
    ) {
      setError('The estimate must be a number of minutes.')
      return
    }
    if (nextEstimate !== task.estimateMinutes)
      patch.estimateMinutes = nextEstimate

    if (priority !== (task.priority ?? null)) patch.priority = priority
    if (difficulty !== (task.difficulty ?? null)) patch.difficulty = difficulty

    const nextScheduledStart = timeInputToMinutes(scheduledStart)
    if (nextScheduledStart !== (task.scheduledStartMinutes ?? null)) {
      patch.scheduledStartMinutes = nextScheduledStart
    }

    const nextGoalId = goalId === NO_GOAL ? null : (goalId as Id<'goals'>)
    if (nextGoalId !== (task.goalId ?? null)) patch.goalId = nextGoalId

    const trimmedCost = costDays.trim()
    const nextCost = trimmedCost === '' ? null : Number(trimmedCost)
    if (nextCost !== null && (!Number.isFinite(nextCost) || nextCost <= 0)) {
      setError('The cost must be a positive number of days.')
      return
    }
    if (nextCost !== (task.costDays ?? null)) patch.costDays = nextCost

    setSaving(true)
    setError(null)
    try {
      await updateTask(patch)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
      setSaving(false)
    }
  }

  return (
    <form className="tdp-form" onSubmit={handleSave}>
      <div className="tdp-form__title-row">
        <EmojiGlyphButton value={emoji} disabled={saving} onSelect={setEmoji} />
        <input
          className="tdp-form__title-input"
          value={title}
          disabled={saving}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          aria-label="Title"
        />
      </div>

      <div className="tdp-form__body">
        <div className="tdp-field tdp-field--wide">
          <span className="tdp-field__label">Description</span>
          <textarea
            className="tdp-input"
            value={description}
            disabled={saving}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anything worth remembering about this task (optional)"
          />
        </div>

        <div className="tdp-form__section-head">Schedule</div>
        <div className="tdp-form__grid">
          <div className="tdp-field">
            <span className="tdp-field__label">Target date</span>
            <input
              type="datetime-local"
              className="tdp-input"
              value={softDeadline}
              disabled={saving}
              onChange={(e) => setSoftDeadline(e.target.value)}
            />
          </div>
          <div className="tdp-field">
            <span className="tdp-field__label">Hard deadline</span>
            <input
              type="datetime-local"
              className="tdp-input"
              value={hardDeadline}
              disabled={saving}
              onChange={(e) => setHardDeadline(e.target.value)}
            />
          </div>
          <div className="tdp-field">
            <span className="tdp-field__label">Estimate (minutes)</span>
            <input
              type="number"
              min={0}
              className="tdp-input"
              value={estimateMinutes}
              disabled={saving}
              onChange={(e) => setEstimateMinutes(e.target.value)}
              placeholder="30"
            />
          </div>
          <div className="tdp-field">
            <span className="tdp-field__label">Time slot</span>
            <input
              type="time"
              step={900}
              className="tdp-input"
              value={scheduledStart}
              disabled={saving}
              onChange={(e) => setScheduledStart(e.target.value)}
            />
            <span className="tdp-field__hint">
              When in the day work starts; the estimate sets its length.
            </span>
          </div>
        </div>

        <div className="tdp-form__section-head">Planning</div>
        <div className="tdp-form__grid">
          <div className="tdp-field">
            <span className="tdp-field__label">Status</span>
            <Select
              value={status}
              disabled={saving}
              onValueChange={(next) => setStatus(next as TaskStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="tdp-field tdp-field--narrow">
            <span className="tdp-field__label">Priority</span>
            <div className="t-seg">
              <button
                type="button"
                disabled={saving}
                data-active={priority === null || undefined}
                onClick={() => setPriority(null)}
              >
                None
              </button>
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={saving}
                  data-active={priority === p || undefined}
                  onClick={() => setPriority(p)}
                >
                  <span className={`t-prio-dot t-prio-dot--${p}`} />
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="tdp-field">
            <div className="tdp-slider-head">
              <span className="tdp-field__label">Difficulty</span>
              <span className="tdp-slider-value">
                {difficulty === null
                  ? 'Not set'
                  : `${DIFFICULTY_WORDS[difficulty]} (${difficulty}/5)`}
              </span>
              <button
                type="button"
                className="tdp-slider-clear"
                disabled={saving || difficulty === null}
                onClick={() => setDifficulty(null)}
              >
                Clear
              </button>
            </div>
            <div data-unset={difficulty === null || undefined}>
              <Slider
                min={1}
                max={5}
                step={1}
                disabled={saving}
                value={[difficulty ?? 3]}
                onValueChange={([v]) => setDifficulty(v ?? 3)}
                aria-label="Difficulty"
              />
            </div>
          </div>
          <div className="tdp-field">
            <span className="tdp-field__label">Goal</span>
            <Select
              value={goalId}
              disabled={saving || goals === undefined}
              onValueChange={setGoalId}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_GOAL}>None</SelectItem>
                {goalOptions.map((goal) => (
                  <SelectItem key={goal._id} value={goal._id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="tdp-field tdp-field--narrow">
            <span className="tdp-field__label">Cost (days)</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="tdp-input"
              style={{ maxWidth: 110 }}
              value={costDays}
              disabled={saving}
              onChange={(e) => setCostDays(e.target.value)}
              placeholder="1.5"
            />
          </div>
        </div>
      </div>

      {error && <p className="tdp-form__error">{error}</p>}

      <div className="tdp-form__foot">
        <button
          type="button"
          className="tdp-btn"
          disabled={saving}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="tdp-btn tdp-btn--primary"
          disabled={saving || title.trim() === ''}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
