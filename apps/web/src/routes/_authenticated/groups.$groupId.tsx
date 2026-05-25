import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import { UserButton } from '@clerk/tanstack-react-start'
import { Button } from '@org/ui/components/button'
import { cn } from '@org/ui/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Authenticated, useMutation, useQuery } from 'convex/react'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/_authenticated/groups/$groupId')({
  component: GroupDetailPage,
})

const GROUP_COLOR_TOKENS = [
  'indigo',
  'violet',
  'emerald',
  'amber',
  'rose',
  'slate',
] as const
type GroupColorToken = (typeof GROUP_COLOR_TOKENS)[number]
const GROUP_COLOR_HEX: Record<GroupColorToken, string> = {
  indigo: '#5b6cf5',
  violet: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#64748b',
}
function colorForGroup(color: string | undefined): string {
  if (!color) return GROUP_COLOR_HEX.indigo
  if ((GROUP_COLOR_TOKENS as readonly string[]).includes(color)) {
    return GROUP_COLOR_HEX[color as GroupColorToken]
  }
  return color
}

function GroupIcon({
  group,
  size = 56,
}: {
  group: Pick<Doc<'taskGroups'>, 'iconImageUrl' | 'icon' | 'color' | 'name'>
  size?: number
}) {
  const dim = `${size}px`
  if (group.iconImageUrl) {
    return (
      <img
        src={group.iconImageUrl}
        alt=""
        className="rounded-xl object-cover"
        style={{ width: dim, height: dim }}
      />
    )
  }
  if (group.icon) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{
          width: dim,
          height: dim,
          background: `${colorForGroup(group.color)}1a`,
          fontSize: size * 0.55,
        }}
      >
        {group.icon}
      </div>
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl font-semibold text-white"
      style={{
        width: dim,
        height: dim,
        background: colorForGroup(group.color),
        fontSize: size * 0.4,
      }}
    >
      {group.name.slice(0, 1).toUpperCase()}
    </div>
  )
}

function GroupDetailPage() {
  const { groupId } = Route.useParams()
  const id = groupId as Id<'taskGroups'>

  return (
    <main className="mx-auto max-w-4xl p-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="/groups">← All groups</Link>
        </Button>
        <UserButton />
      </header>

      <Authenticated>
        <GroupDetail id={id} />
      </Authenticated>
    </main>
  )
}

function GroupDetail({ id }: { id: Id<'taskGroups'> }) {
  const group = useQuery(api.groups.get, { id })
  const tasks = useQuery(api.tasks.list, { groupId: id })
  const [picker, setPicker] = useState(false)

  if (group === undefined) {
    return <div className="text-sm text-muted-foreground">Loading group…</div>
  }
  if (group === null) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <h2 className="mb-1 text-base font-semibold">Group not found</h2>
        <p className="text-sm text-muted-foreground">
          It may have been deleted, or you don't have access.
        </p>
      </div>
    )
  }

  const openTasks =
    tasks?.filter((t) => t.status === 'open' || t.status === 'in_progress') ?? []
  const doneTasks =
    tasks?.filter((t) => t.status === 'done' || t.status === 'cancelled') ?? []

  return (
    <div>
      <section className="mb-8 flex items-start gap-4">
        <GroupIcon group={group} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {group.name}
          </h1>
          {group.description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {group.description}
            </p>
          ) : (
            <p className="mt-1 text-sm italic text-muted-foreground/60">
              No description
            </p>
          )}
        </div>
        <Button onClick={() => setPicker(true)}>+ Add tasks</Button>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Open · {openTasks.length}
        </h2>
        {tasks === undefined ? (
          <div className="text-sm text-muted-foreground">Loading tasks…</div>
        ) : openTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No open tasks in this group. Click <b>Add tasks</b> to file ungrouped
            tasks here.
          </div>
        ) : (
          <ul className="divide-y rounded-xl border">
            {openTasks.map((task) => (
              <TaskRow key={task._id} task={task} />
            ))}
          </ul>
        )}
      </section>

      {doneTasks.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Closed · {doneTasks.length}
          </h2>
          <ul className="divide-y rounded-xl border opacity-70">
            {doneTasks.map((task) => (
              <TaskRow key={task._id} task={task} />
            ))}
          </ul>
        </section>
      )}

      <AddTasksModal
        open={picker}
        onClose={() => setPicker(false)}
        groupId={id}
        groupName={group.name}
      />
    </div>
  )
}

function TaskRow({ task }: { task: Doc<'tasks'> }) {
  const deadline = task.softDeadline ?? task.hardDeadline
  return (
    <li>
      <Link
        to="/tasks/$taskId"
        params={{ taskId: task._id }}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
      >
        <div
          className={cn(
            'h-2.5 w-2.5 shrink-0 rounded-full',
            task.status === 'done'
              ? 'bg-emerald-500'
              : task.status === 'in_progress'
                ? 'bg-amber-500'
                : task.status === 'cancelled'
                  ? 'bg-muted-foreground'
                  : 'bg-foreground/30',
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{task.title}</div>
          {task.description && (
            <div className="truncate text-xs text-muted-foreground">
              {task.description}
            </div>
          )}
        </div>
        {deadline && (
          <div className="shrink-0 text-xs text-muted-foreground">
            {new Date(deadline).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}
      </Link>
    </li>
  )
}

function AddTasksModal({
  open,
  onClose,
  groupId,
  groupName,
}: {
  open: boolean
  onClose: () => void
  groupId: Id<'taskGroups'>
  groupName: string
}) {
  const ungrouped = useQuery(api.tasks.listUngrouped, open ? {} : 'skip')
  const addTasks = useMutation(api.groups.addTasks)
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

  const sorted = useMemo(
    () =>
      (ungrouped ?? []).slice().sort((a, b) => {
        const ad = a.softDeadline ?? a.hardDeadline ?? Number.POSITIVE_INFINITY
        const bd = b.softDeadline ?? b.hardDeadline ?? Number.POSITIVE_INFINITY
        return ad - bd
      }),
    [ungrouped],
  )

  if (!open) return null

  function toggle(id: Id<'tasks'>) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    if (selected.size === 0 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await addTasks({ groupId, taskIds: Array.from(selected) })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tasks')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-[10vh]"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-xl flex-col rounded-2xl border bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Add tasks to {groupName}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick from open tasks that aren't in a group yet.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {ungrouped === undefined ? (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              Loading ungrouped tasks…
            </div>
          ) : sorted.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No ungrouped open tasks. Capture some on the Today page first.
            </div>
          ) : (
            <ul>
              {sorted.map((task) => {
                const checked = selected.has(task._id)
                return (
                  <li key={task._id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 hover:bg-muted/50',
                        checked && 'bg-muted/60',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-foreground"
                        checked={checked}
                        onChange={() => toggle(task._id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="truncate text-xs text-muted-foreground">
                            {task.description}
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {task.status === 'in_progress' ? 'in progress' : 'open'}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && (
          <div className="border-t bg-destructive/10 px-6 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between border-t px-6 py-3">
          <div className="text-xs text-muted-foreground">
            {selected.size} selected
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || selected.size === 0}
            >
              {submitting
                ? 'Adding…'
                : selected.size === 0
                  ? 'Add tasks'
                  : `Add ${selected.size}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
