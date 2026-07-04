import { api } from '@convex/_generated/api'
import type { GoalListItem } from '@convex/goals'
import { UserButton, useUser } from '@clerk/tanstack-react-start'
import { Button } from '@org/ui/components/button'
import { Calendar } from '@org/ui/components/calendar'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@org/ui/components/drawer'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@org/ui/components/popover'
import { cn } from '@org/ui/lib/utils'
import { CalendarIcon } from 'lucide-react'
import {
  createFileRoute,
  Link,
  Outlet,
  useChildMatches,
  useNavigate,
} from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  dateInputToDate,
  dateInputToMs,
  describeDeadline,
  formatDays,
  formatDeadlineLabel,
  GoalTypeSelect,
  GoalTypeSelectionIcon,
  INPUT_CLASSES,
  msToDateInput,
  parseTypeValue,
  startOfToday,
  TEXTAREA_CLASSES,
  TypeBadge,
  type GoalStatus,
} from '~/components/goals/goal-ui'

export const Route = createFileRoute('/_authenticated/goals')({
  component: GoalsRoute,
})

// /goals/$goalId nests under this route; without this the child page would
// never render because GoalsPage doesn't render an Outlet.
function GoalsRoute() {
  const childMatches = useChildMatches()
  if (childMatches.length > 0) return <Outlet />
  return <GoalsPage />
}

function GoalsPage() {
  const { user } = useUser()

  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? user?.id}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">Today</Link>
          </Button>
          <UserButton />
        </div>
      </header>

      <Authenticated>
        <RemindersBanner />
        <GoalsList />
      </Authenticated>
    </main>
  )
}

function reminderText(reminder: {
  kind: 'approaching' | 'overdue'
  daysRemaining: number
}): string {
  if (reminder.kind === 'overdue') {
    const over = Math.max(1, -reminder.daysRemaining)
    return `overdue by ${over} day${over === 1 ? '' : 's'}`
  }
  if (reminder.daysRemaining <= 0) return 'due today'
  return `due in ${reminder.daysRemaining} day${reminder.daysRemaining === 1 ? '' : 's'}`
}

function RemindersBanner() {
  const reminders = useQuery(api.goalReminders.listUnread, {})
  const markRead = useMutation(api.goalReminders.markRead)
  const markAllRead = useMutation(api.goalReminders.markAllRead)

  if (reminders === undefined || reminders.length === 0) return null

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-amber-900">
          Goal reminders
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="border-amber-200 bg-transparent text-amber-900 hover:bg-amber-100"
          onClick={() => {
            void markAllRead({})
          }}
        >
          Mark all read
        </Button>
      </div>
      <ul className="space-y-1.5">
        {reminders.map((reminder) => (
          <li
            key={reminder._id}
            className="flex items-center justify-between gap-3 text-sm text-amber-900"
          >
            <span className="min-w-0 truncate">
              <Link
                to="/goals/$goalId"
                params={{ goalId: reminder.goalId }}
                className="font-medium underline-offset-2 hover:underline"
              >
                {reminder.goalTitle}
              </Link>{' '}
              <span
                className={
                  reminder.kind === 'overdue' ? 'text-destructive' : undefined
                }
              >
                {reminderText(reminder)}
              </span>
            </span>
            <button
              type="button"
              aria-label="Dismiss reminder"
              className="shrink-0 rounded-md px-1.5 text-amber-900/60 transition hover:bg-amber-100 hover:text-amber-900"
              onClick={() => {
                void markRead({ id: reminder._id })
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const STATUS_FILTERS: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'archived', label: 'Archived' },
]

function GoalsList() {
  const [status, setStatus] = useState<GoalStatus>('active')
  const goals = useQuery(api.goals.list, { status })
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border p-0.5">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/goals/types">Manage types</Link>
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            + New goal
          </Button>
        </div>
      </div>

      {goals === undefined ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyState status={status} onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal._id} goal={goal} />
          ))}
        </div>
      )}

      <NewGoalDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

function EmptyState({
  status,
  onCreate,
}: {
  status: GoalStatus
  onCreate: () => void
}) {
  if (status !== 'active') {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No {status} goals yet.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-dashed p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl">
        ◎
      </div>
      <h2 className="mb-1 text-base font-semibold">No goals yet</h2>
      <p className="mx-auto mb-4 max-w-sm text-sm text-muted-foreground">
        Goals are objectives with a deadline — like Run a marathon or Launch
        the app. Create one and organize tasks toward it.
      </p>
      <Button onClick={onCreate}>Create your first goal</Button>
    </div>
  )
}

function GoalCard({ goal }: { goal: GoalListItem }) {
  const deadline = describeDeadline(goal.deadline, Date.now())
  const progress = goal.progress
  const pct =
    progress.totalCostDays > 0
      ? Math.min(
          100,
          Math.round((progress.completeCostDays / progress.totalCostDays) * 100),
        )
      : 0

  return (
    <Link
      to="/goals/$goalId"
      params={{ goalId: goal._id }}
      className="flex h-full flex-col gap-3 rounded-xl border bg-card p-4 transition hover:border-ring hover:shadow-sm"
    >
      <div className="min-w-0">
        <div className="truncate font-semibold leading-tight">{goal.title}</div>
        {goal.type && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={goal.type} />
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {new Date(goal.deadline).toLocaleDateString()} ·{' '}
        <span
          className={cn(deadline.overdue && 'font-medium text-destructive')}
        >
          {deadline.label}
        </span>
      </div>
      <div className="mt-auto space-y-1.5">
        <div className="text-xs text-muted-foreground">
          {progress.completeTasks}/{progress.totalTasks} tasks ·{' '}
          {formatDays(progress.completeCostDays)} of{' '}
          {formatDays(progress.totalCostDays)} days done
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function NewGoalDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const createGoal = useMutation(api.goals.create)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [deadlineOpen, setDeadlineOpen] = useState(false)
  const [typeValue, setTypeValue] = useState('')
  const [reminderDays, setReminderDays] = useState('7')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setDeadline('')
      setDeadlineOpen(false)
      setTypeValue('')
      setReminderDays('7')
      setSubmitting(false)
      setError(null)
    }
  }, [open])

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    const deadlineMs = dateInputToMs(deadline)
    if (deadlineMs === null) {
      setError('A deadline is required.')
      return
    }
    if (deadlineMs <= Date.now()) {
      setError('Deadline must be in the future.')
      return
    }
    const reminder = Number(reminderDays.trim())
    if (!Number.isInteger(reminder) || reminder < 1 || reminder > 90) {
      setError('Reminder window must be a whole number between 1 and 90 days.')
      return
    }
    const type = parseTypeValue(typeValue)
    setSubmitting(true)
    setError(null)
    try {
      const id = await createGoal({
        title: trimmed,
        description: description.trim() || undefined,
        deadline: deadlineMs,
        typeSlug: type.kind === 'system' ? type.slug : undefined,
        customTypeId: type.kind === 'custom' ? type.id : undefined,
        reminderDaysBefore: reminder,
      })
      onClose()
      void navigate({ to: '/goals/$goalId', params: { goalId: id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create goal')
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
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-3">
              <GoalTypeSelectionIcon value={typeValue} size={44} />
              <div className="min-w-0 space-y-0.5">
                <DrawerTitle
                  className={cn(!title.trim() && 'text-muted-foreground')}
                >
                  {title.trim() || 'New goal'}
                </DrawerTitle>
                <DrawerDescription>
                  {description.trim() ||
                    'An objective with a deadline. Organize tasks toward it.'}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <Field label="Title">
              <input
                autoFocus
                className={cn(INPUT_CLASSES, 'w-full')}
                value={title}
                disabled={submitting}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Run a marathon, Launch the app…"
              />
            </Field>

            <Field label="Description">
              <textarea
                className={TEXTAREA_CLASSES}
                value={description}
                disabled={submitting}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does achieving this look like? (optional)"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Deadline">
                <Popover open={deadlineOpen} onOpenChange={setDeadlineOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={submitting}
                      className={cn(
                        INPUT_CLASSES,
                        'w-full items-center justify-between gap-2 text-left',
                        !deadline && 'text-muted-foreground',
                      )}
                    >
                      {deadline
                        ? formatDeadlineLabel(deadline)
                        : 'Pick a date'}
                      <CalendarIcon className="size-4 shrink-0 opacity-60" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      autoFocus
                      selected={dateInputToDate(deadline)}
                      onSelect={(date) => {
                        setDeadline(date ? msToDateInput(date.getTime()) : '')
                        setDeadlineOpen(false)
                      }}
                      disabled={{ before: startOfToday() }}
                    />
                  </PopoverContent>
                </Popover>
              </Field>
              <Field label="Remind me (days before)">
                <input
                  type="number"
                  min={1}
                  max={90}
                  step={1}
                  className={INPUT_CLASSES}
                  value={reminderDays}
                  disabled={submitting}
                  onChange={(e) => setReminderDays(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Type">
              <GoalTypeSelect
                value={typeValue}
                onChange={setTypeValue}
                disabled={submitting}
              />
            </Field>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          <DrawerFooter className="flex-row justify-end gap-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || title.trim() === '' || deadline === ''}
            >
              {submitting ? 'Creating…' : 'Create goal'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
