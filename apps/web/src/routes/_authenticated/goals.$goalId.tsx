import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import type { GoalListItem } from '@convex/goals'
import { Button } from '@org/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@org/ui/components/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@org/ui/components/dropdown-menu'
import { cn } from '@org/ui/lib/utils'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import {
  Component,
  useEffect,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  dateInputToMs,
  describeDeadline,
  formatDays,
  goalTypeValue,
  GoalTypeSelect,
  GoalTypeSelectionIcon,
  INPUT_CLASSES,
  msToDateInput,
  parseTypeValue,
  TEXTAREA_CLASSES,
  TypeBadge,
} from '~/components/goals/goal-ui'
import { MetricsSection } from '~/components/goals/metrics'
import { PriorityBadge } from '~/components/tasks/priority'
import { AppShell } from '~/components/today/app-shell'
import { AppBreadcrumbs } from '~/components/today/breadcrumbs'

export const Route = createFileRoute('/_authenticated/goals/$goalId')({
  component: GoalDetailPage,
})

type Stage = 'inactive' | 'active' | 'complete'

const STAGES: { key: Stage; label: string }[] = [
  { key: 'inactive', label: 'Inactive' },
  { key: 'active', label: 'Active' },
  { key: 'complete', label: 'Complete' },
]

// api.goals.get throws (instead of returning null) when the goal is missing
// or not yours — e.g. right after deleting it. Catch that here and show a
// friendly dead end instead of the router's error page.
class GoalErrorBoundary extends Component<
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
        <div className="rounded-xl border border-dashed p-12 text-center">
          <h2 className="mb-1 text-base font-semibold">Goal not found</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            It may have been deleted, or you don't have access.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/goals">← All goals</Link>
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

function GoalDetailPage() {
  const { goalId } = Route.useParams()
  const id = goalId as Id<'goals'>

  return (
    <AppShell active="goals">
      <main className="px-3 pb-16 pt-2.5">
        <Authenticated>
          <GoalErrorBoundary>
            <GoalDetail id={id} />
          </GoalErrorBoundary>
        </Authenticated>
      </main>
    </AppShell>
  )
}

function GoalDetail({ id }: { id: Id<'goals'> }) {
  const goal = useQuery(api.goals.get, { id })

  if (goal === undefined) {
    return (
      <>
        <AppBreadcrumbs
          items={[{ label: 'Goals', to: '/goals' }, { label: '…' }]}
        />
        <p className="mt-4 text-sm text-muted-foreground">Loading goal…</p>
      </>
    )
  }

  return (
    <>
      <AppBreadcrumbs
        items={[{ label: 'Goals', to: '/goals' }, { label: goal.title }]}
      />
      <div className="mt-4 space-y-8">
        <GoalHeader goal={goal} />
        <CostStrip goal={goal} />
        <MetricsSection goalId={goal._id} goalDeadline={goal.deadline} />
        <GoalBoard goalId={goal._id} />
      </div>
    </>
  )
}

function GoalHeader({ goal }: { goal: GoalListItem }) {
  const navigate = useNavigate()
  const setStatus = useMutation(api.goals.setStatus)
  const removeGoal = useMutation(api.goals.remove)
  const [editOpen, setEditOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deadline = describeDeadline(goal.deadline, Date.now())

  async function handleSetStatus(status: Doc<'goals'>['status']) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await setStatus({ id: goal._id, status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        'Delete this goal? Its tasks are kept but detached from the goal. This cannot be undone.',
      )
    ) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await removeGoal({ id: goal._id })
      await navigate({ to: '/goals' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal')
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {goal.type && (
            <GoalTypeSelectionIcon
              value={goalTypeValue(goal)}
              size={44}
              className="mt-0.5"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {goal.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <TypeBadge type={goal.type} />
              {goal.status !== 'active' && (
                <span className="rounded-full border px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {goal.status}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {new Date(goal.deadline).toLocaleDateString()} ·{' '}
                <span
                  className={cn(
                    deadline.overdue && 'font-medium text-destructive',
                  )}
                >
                  {deadline.label}
                </span>
              </span>
            </div>
            {goal.description && (
              <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
                {goal.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {goal.status === 'active' && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => {
                void handleSetStatus('achieved')
              }}
            >
              Mark achieved
            </Button>
          )}
          {goal.status !== 'active' && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => {
                void handleSetStatus('active')
              }}
            >
              Reopen
            </Button>
          )}
          {goal.status !== 'archived' && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => {
                void handleSetStatus('archived')
              }}
            >
              Archive
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen((v) => !v)}
          >
            {editOpen ? 'Close editor' : 'Edit'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busy}
            onClick={() => {
              void handleDelete()
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {editOpen && (
        <GoalEditor goal={goal} onSaved={() => setEditOpen(false)} />
      )}
    </section>
  )
}

function GoalEditor({
  goal,
  onSaved,
}: {
  goal: GoalListItem
  onSaved: () => void
}) {
  const updateGoal = useMutation(api.goals.update)
  const [title, setTitle] = useState(goal.title)
  const [description, setDescription] = useState(goal.description ?? '')
  const [deadline, setDeadline] = useState(msToDateInput(goal.deadline))
  const [typeValue, setTypeValue] = useState(goalTypeValue(goal))
  const [reminderDays, setReminderDays] = useState(
    String(goal.reminderDaysBefore),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(goal.title)
    setDescription(goal.description ?? '')
    setDeadline(msToDateInput(goal.deadline))
    setTypeValue(goalTypeValue(goal))
    setReminderDays(String(goal.reminderDaysBefore))
  }, [goal._id, goal.updatedAt])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Title is required.')
      return
    }

    const patch: {
      id: Id<'goals'>
      title?: string
      description?: string | null
      deadline?: number
      typeSlug?: string | null
      customTypeId?: Id<'goalTypes'> | null
      reminderDaysBefore?: number
    } = { id: goal._id }

    if (trimmedTitle !== goal.title) patch.title = trimmedTitle

    const nextDescription =
      description.trim() === '' ? null : description.trim()
    if (nextDescription !== goal.description) {
      patch.description = nextDescription
    }

    const nextDeadline = dateInputToMs(deadline)
    if (nextDeadline === null) {
      setError('A deadline is required.')
      return
    }
    if (msToDateInput(goal.deadline) !== deadline) {
      patch.deadline = nextDeadline
    }

    const reminder = Number(reminderDays.trim())
    if (!Number.isInteger(reminder) || reminder < 1 || reminder > 90) {
      setError('Reminder window must be a whole number between 1 and 90 days.')
      return
    }
    if (reminder !== goal.reminderDaysBefore) {
      patch.reminderDaysBefore = reminder
    }

    if (typeValue !== goalTypeValue(goal)) {
      const selection = parseTypeValue(typeValue)
      if (selection.kind === 'none') {
        patch.typeSlug = null
        patch.customTypeId = null
      } else if (selection.kind === 'system') {
        patch.typeSlug = selection.slug
      } else {
        patch.customTypeId = selection.id
      }
    }

    setSaving(true)
    setError(null)
    try {
      await updateGoal(patch)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="space-y-4 rounded-xl border bg-card p-4"
    >
      <div className="flex items-center gap-3 border-b pb-4">
        <GoalTypeSelectionIcon value={typeValue} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium leading-tight">
            {title.trim() || 'Untitled goal'}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {description.trim() || 'No description yet'}
          </p>
        </div>
      </div>

      <label className="block space-y-1 text-xs text-muted-foreground">
        <span>Title</span>
        <input
          type="text"
          value={title}
          disabled={saving}
          onChange={(e) => setTitle(e.target.value)}
          className={INPUT_CLASSES}
        />
      </label>

      <label className="block space-y-1 text-xs text-muted-foreground">
        <span>Description</span>
        <textarea
          value={description}
          disabled={saving}
          onChange={(e) => setDescription(e.target.value)}
          className={TEXTAREA_CLASSES}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Deadline</span>
          <input
            type="date"
            value={deadline}
            disabled={saving}
            onChange={(e) => setDeadline(e.target.value)}
            className={INPUT_CLASSES}
          />
        </label>
        <div className="space-y-1 text-xs text-muted-foreground">
          <span>Type</span>
          <GoalTypeSelect
            value={typeValue}
            onChange={setTypeValue}
            disabled={saving}
          />
        </div>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Remind me (days before deadline)</span>
          <input
            type="number"
            min={1}
            max={90}
            step={1}
            value={reminderDays}
            disabled={saving}
            onChange={(e) => setReminderDays(e.target.value)}
            className={INPUT_CLASSES}
          />
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function CostStrip({ goal }: { goal: GoalListItem }) {
  const progress = goal.progress
  const stats: { label: string; value: string }[] = [
    { label: 'Total cost', value: `${formatDays(progress.totalCostDays)}d` },
    { label: 'Done', value: `${formatDays(progress.completeCostDays)}d` },
    {
      label: 'Remaining',
      value: `${formatDays(progress.remainingCostDays)}d`,
    },
    {
      label: 'Tasks',
      value: `${progress.completeTasks}/${progress.totalTasks}`,
    },
  ]

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="text-lg font-semibold tabular-nums">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      {progress.uncostedTasks > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {progress.uncostedTasks} task
          {progress.uncostedTasks === 1 ? '' : 's'} uncosted — totals above
          undercount by these.
        </p>
      )}
    </section>
  )
}

function GoalBoard({ goalId }: { goalId: Id<'goals'> }) {
  const board = useQuery(api.goals.board, { id: goalId })
  const moveTask = useMutation(api.goals.moveTask)
  const removeTask = useMutation(api.goals.removeTask)
  const [dragging, setDragging] = useState<Id<'tasks'> | null>(null)
  const [overStage, setOverStage] = useState<Stage | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMove(
    taskId: Id<'tasks'>,
    stage: Stage,
    beforeId: Id<'tasks'> | null,
    afterId: Id<'tasks'> | null,
  ) {
    setError(null)
    try {
      await moveTask({
        taskId,
        stage,
        beforeId: beforeId ?? undefined,
        afterId: afterId ?? undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task')
    }
  }

  async function handleRemove(taskId: Id<'tasks'>) {
    setError(null)
    try {
      await removeTask({ taskId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove task')
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Board</h2>
        <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          Add existing tasks
        </Button>
      </div>

      <QuickAddTask goalId={goalId} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {board === undefined ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STAGES.map((stage) => (
            <BoardColumn
              key={stage.key}
              stage={stage.key}
              label={stage.label}
              tasks={board[stage.key]}
              dragging={dragging}
              setDragging={setDragging}
              highlighted={overStage === stage.key}
              setOverStage={setOverStage}
              onMove={handleMove}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <AddExistingTasksDrawer
        goalId={goalId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </section>
  )
}

function BoardColumn({
  stage,
  label,
  tasks,
  dragging,
  setDragging,
  highlighted,
  setOverStage,
  onMove,
  onRemove,
}: {
  stage: Stage
  label: string
  tasks: Doc<'tasks'>[]
  dragging: Id<'tasks'> | null
  setDragging: (id: Id<'tasks'> | null) => void
  highlighted: boolean
  setOverStage: (stage: Stage | null) => void
  onMove: (
    taskId: Id<'tasks'>,
    stage: Stage,
    beforeId: Id<'tasks'> | null,
    afterId: Id<'tasks'> | null,
  ) => Promise<void>
  onRemove: (taskId: Id<'tasks'>) => Promise<void>
}) {
  // Drop on a card: insert above or below it depending on pointer position.
  function handleDropOnCard(
    target: Doc<'tasks'>,
    e: DragEvent<HTMLDivElement>,
  ) {
    e.preventDefault()
    e.stopPropagation()
    setOverStage(null)
    if (dragging === null || dragging === target._id) return
    const rect = e.currentTarget.getBoundingClientRect()
    const below = e.clientY > rect.top + rect.height / 2
    const list = tasks.filter((t) => t._id !== dragging)
    const targetIdx = list.findIndex((t) => t._id === target._id)
    if (targetIdx === -1) return
    const insertIdx = below ? targetIdx + 1 : targetIdx
    const beforeTask = list[insertIdx - 1] ?? null
    const afterTask = list[insertIdx] ?? null
    void onMove(
      dragging,
      stage,
      beforeTask ? beforeTask._id : null,
      afterTask ? afterTask._id : null,
    )
  }

  // Drop on empty column space: land at the end (no neighbors).
  function handleDropOnColumn(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setOverStage(null)
    if (dragging === null) return
    void onMove(dragging, stage, null, null)
  }

  return (
    <div
      className={cn(
        'flex min-h-48 flex-col rounded-xl border bg-muted/20 p-2 transition',
        highlighted && 'border-ring bg-muted/50',
      )}
      onDragOver={(e) => {
        if (dragging === null) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setOverStage(stage)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        setOverStage(null)
      }}
      onDrop={handleDropOnColumn}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.length === 0 && (
          <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
            No tasks
          </p>
        )}
        {tasks.map((task) => (
          <BoardCard
            key={task._id}
            task={task}
            stage={stage}
            dragging={dragging}
            setDragging={setDragging}
            onDropOnCard={handleDropOnCard}
            onMove={onMove}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  )
}

function BoardCard({
  task,
  stage,
  dragging,
  setDragging,
  onDropOnCard,
  onMove,
  onRemove,
}: {
  task: Doc<'tasks'>
  stage: Stage
  dragging: Id<'tasks'> | null
  setDragging: (id: Id<'tasks'> | null) => void
  onDropOnCard: (target: Doc<'tasks'>, e: DragEvent<HTMLDivElement>) => void
  onMove: (
    taskId: Id<'tasks'>,
    stage: Stage,
    beforeId: Id<'tasks'> | null,
    afterId: Id<'tasks'> | null,
  ) => Promise<void>
  onRemove: (taskId: Id<'tasks'>) => Promise<void>
}) {
  const otherStages = STAGES.filter((s) => s.key !== stage)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', task._id)
        setDragging(task._id)
      }}
      onDragEnd={() => setDragging(null)}
      onDragOver={(e) => {
        if (dragging === null || dragging === task._id) return
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => onDropOnCard(task, e)}
      className={cn(
        'cursor-grab rounded-lg border bg-card p-3 shadow-xs transition active:cursor-grabbing',
        dragging === task._id && 'opacity-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/tasks/$taskId"
          params={{ taskId: task._id }}
          draggable={false}
          className="min-w-0 flex-1 text-sm font-medium leading-snug underline-offset-2 hover:underline"
        >
          {task.emoji && (
            <span aria-hidden className="mr-1.5">
              {task.emoji}
            </span>
          )}
          {task.title}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Task actions"
              className="shrink-0 rounded-md px-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              ⋯
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {otherStages.map((s) => (
              <DropdownMenuItem
                key={s.key}
                onSelect={() => {
                  void onMove(task._id, s.key, null, null)
                }}
              >
                Move to {s.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                void onRemove(task._id)
              }}
            >
              Remove from goal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {(task.priority != null ||
        (task.costDays !== undefined && task.costDays !== null)) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {task.priority != null && <PriorityBadge priority={task.priority} />}
          {task.costDays !== undefined && task.costDays !== null && (
            <span className="inline-block rounded-full border px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground">
              {formatDays(task.costDays)}d
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function QuickAddTask({ goalId }: { goalId: Id<'goals'> }) {
  const createTask = useMutation(api.tasks.create)
  const [title, setTitle] = useState('')
  const [costDays, setCostDays] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    const trimmedCost = costDays.trim()
    let cost: number | null = null
    if (trimmedCost !== '') {
      cost = Number(trimmedCost)
      if (!Number.isFinite(cost) || cost <= 0) {
        setError('Cost must be a positive number of days.')
        return
      }
    }
    setSubmitting(true)
    setError(null)
    try {
      await createTask({ title: trimmed, goalId, costDays: cost })
      setTitle('')
      setCostDays('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={INPUT_CLASSES}
          value={title}
          disabled={submitting}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick-add a task to this goal…"
        />
        <input
          type="number"
          min={0.5}
          step={0.5}
          className={cn(INPUT_CLASSES, 'max-w-28 flex-none')}
          value={costDays}
          disabled={submitting}
          onChange={(e) => setCostDays(e.target.value)}
          placeholder="Days"
          aria-label="Cost in days"
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitting || title.trim() === ''}
        >
          {submitting ? 'Adding…' : 'Add task'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}

function AddExistingTasksDrawer({
  goalId,
  open,
  onClose,
}: {
  goalId: Id<'goals'>
  open: boolean
  onClose: () => void
}) {
  const tasks = useQuery(api.tasks.list, {})
  const addTasks = useMutation(api.goals.addTasks)
  const [selected, setSelected] = useState<Set<Id<'tasks'>>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelected(new Set())
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  const candidates = (tasks ?? []).filter(
    (t) =>
      (t.goalId ?? null) === null &&
      (t.status === 'open' || t.status === 'in_progress'),
  )

  function toggle(id: Id<'tasks'>) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (selected.size === 0 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await addTasks({ goalId, taskIds: Array.from(selected) })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tasks')
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      direction="right"
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg">
        <DrawerHeader className="border-b">
          <DrawerTitle>Add existing tasks</DrawerTitle>
          <DrawerDescription>
            Open tasks that aren't part of any goal yet.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {tasks === undefined ? (
            <p className="text-sm text-muted-foreground">Loading tasks…</p>
          ) : candidates.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No unattached open tasks.
            </p>
          ) : (
            <ul className="space-y-1">
              {candidates.map((task) => (
                <li key={task._id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition hover:bg-muted/40">
                    <input
                      type="checkbox"
                      checked={selected.has(task._id)}
                      disabled={submitting}
                      onChange={() => toggle(task._id)}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {task.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {task.status === 'open' ? 'Open' : 'In progress'}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <div className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <DrawerFooter className="flex-row justify-end gap-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={submitting || selected.size === 0}
            onClick={() => {
              void handleAdd()
            }}
          >
            {submitting
              ? 'Adding…'
              : `Add ${selected.size} task${selected.size === 1 ? '' : 's'}`}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
