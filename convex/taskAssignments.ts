import { ConvexError, v } from 'convex/values'
import { mutation, MutationCtx, QueryCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { getCurrentUser } from './users'

// Keeps hydration and the status fan-out cheap; a friends-scale task never
// needs more people than this.
export const MAX_ASSIGNEES = 10

// Assignee ids from the deprecated on-task fields, for rows written before
// the taskAssignments table existed and not yet backfilled.
function legacyAssigneeIds(task: Doc<'tasks'>): Id<'users'>[] {
  if (task.assigneeUserIds && task.assigneeUserIds.length > 0) {
    return task.assigneeUserIds
  }
  return task.assigneeUserId ? [task.assigneeUserId] : []
}

export async function assigneeIdsForTask(
  ctx: QueryCtx,
  task: Doc<'tasks'>,
): Promise<Id<'users'>[]> {
  const rows = await ctx.db
    .query('taskAssignments')
    .withIndex('by_task', (q) => q.eq('taskId', task._id))
    .take(MAX_ASSIGNEES)
  if (rows.length > 0) return rows.map((row) => row.userId)
  return legacyAssigneeIds(task)
}

export async function canUserEditTask(
  ctx: QueryCtx,
  task: Doc<'tasks'>,
  userId: Id<'users'>,
): Promise<boolean> {
  if (task.creatorId === userId) return true
  const row = await ctx.db
    .query('taskAssignments')
    .withIndex('by_task_and_user', (q) => q.eq('taskId', task._id).eq('userId', userId))
    .unique()
  if (row) return true
  return legacyAssigneeIds(task).includes(userId)
}

// Mirrors a task-status change onto its assignment rows. Call this from every
// mutation that writes tasks.status.
export async function syncAssignmentStatus(
  ctx: MutationCtx,
  taskId: Id<'tasks'>,
  status: Doc<'tasks'>['status'],
) {
  const rows = await ctx.db
    .query('taskAssignments')
    .withIndex('by_task', (q) => q.eq('taskId', taskId))
    .take(MAX_ASSIGNEES)
  await Promise.all(
    rows.filter((row) => row.status !== status).map((row) => ctx.db.patch(row._id, { status })),
  )
}

export async function deleteAssignmentsForTask(ctx: MutationCtx, taskId: Id<'tasks'>) {
  const rows = await ctx.db
    .query('taskAssignments')
    .withIndex('by_task', (q) => q.eq('taskId', taskId))
    .take(MAX_ASSIGNEES)
  await Promise.all(rows.map((row) => ctx.db.delete(row._id)))
}

export function normalizeAssigneeIds(ids: Id<'users'>[]): Id<'users'>[] {
  const unique = Array.from(new Set(ids))
  if (unique.length === 0) {
    throw new ConvexError('A task needs at least one assignee')
  }
  if (unique.length > MAX_ASSIGNEES) {
    throw new ConvexError(`A task can have at most ${MAX_ASSIGNEES} assignees`)
  }
  return unique
}

async function displayName(ctx: QueryCtx, userId: Id<'users'>): Promise<string> {
  const user = await ctx.db.get(userId)
  return user?.name.trim() || user?.email || 'Someone'
}

// Writes the full assignee set for a task and clears the deprecated on-task
// fields so the join table is the only place assignment lives from here on.
export async function replaceAssignees(
  ctx: MutationCtx,
  task: Doc<'tasks'>,
  userIds: Id<'users'>[],
  assignedById: Id<'users'>,
) {
  const next = normalizeAssigneeIds(userIds)
  for (const userId of next) {
    const user = await ctx.db.get(userId)
    if (!user) throw new ConvexError('Assignee not found')
  }
  const existing = await ctx.db
    .query('taskAssignments')
    .withIndex('by_task', (q) => q.eq('taskId', task._id))
    .take(MAX_ASSIGNEES)
  const current =
    existing.length > 0 ? existing.map((row) => row.userId) : legacyAssigneeIds(task)

  const nextSet = new Set(next)
  for (const row of existing) {
    if (!nextSet.has(row.userId)) await ctx.db.delete(row._id)
  }
  const existingSet = new Set(existing.map((row) => row.userId))
  for (const userId of next) {
    if (!existingSet.has(userId)) {
      await ctx.db.insert('taskAssignments', {
        taskId: task._id,
        userId,
        assignedById,
        status: task.status,
      })
    }
  }
  if (task.assigneeUserId !== undefined || task.assigneeUserIds !== undefined) {
    await ctx.db.patch(task._id, {
      assigneeUserId: undefined,
      assigneeUserIds: undefined,
    })
  }
  return { current, next }
}

export const setAssignees = mutation({
  args: {
    taskId: v.id('tasks'),
    assigneeIds: v.array(v.id('users')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)
    if (!user) throw new ConvexError('Not authenticated')
    const task = await ctx.db.get(args.taskId)
    if (!task) throw new ConvexError('Task not found')
    if (!(await canUserEditTask(ctx, task, user._id))) {
      throw new ConvexError('Forbidden')
    }

    const { current, next } = await replaceAssignees(ctx, task, args.assigneeIds, user._id)
    const changed =
      current.length !== next.length || current.some((id) => !next.includes(id))
    if (!changed) return { changed: false }

    await ctx.db.patch(task._id, { updatedAt: Date.now() })
    // The event stores display names, not ids: activity entries are historical
    // statements ("assigned it to Bob"), so a later rename shouldn't rewrite
    // them, and the client can render without extra lookups.
    const currentNames = await Promise.all(current.map((id) => displayName(ctx, id)))
    const nextNames = await Promise.all(next.map((id) => displayName(ctx, id)))
    await ctx.db.insert('taskEvents', {
      taskId: task._id,
      actorId: user._id,
      kind: 'updated',
      changes: [
        {
          field: 'assignees',
          before: JSON.stringify(currentNames),
          after: JSON.stringify(nextNames),
        },
      ],
    })
    return { changed: true }
  },
})
