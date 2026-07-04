import { ConvexError, v } from 'convex/values'
import { mutation, query, QueryCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { getCurrentUser } from './users'
import { taskStatus } from './schema'

const POSITION_STEP = 1024

async function requireUserId(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throw new ConvexError('Not authenticated')
  }
  return user._id
}

async function assertOwnsGoal(
  ctx: QueryCtx,
  goalId: Id<'goals'> | null,
  userId: Id<'users'>,
) {
  if (goalId === null) return
  const goal = await ctx.db.get(goalId)
  if (!goal) throw new ConvexError('Goal not found')
  if (goal.creatorId !== userId) throw new ConvexError('Forbidden')
}

async function nextGoalTailPosition(
  ctx: QueryCtx,
  goalId: Id<'goals'>,
): Promise<number> {
  const last = await ctx.db
    .query('tasks')
    .withIndex('by_goal_position', (q) => q.eq('goalId', goalId))
    .order('desc')
    .take(1)
  if (last.length === 0) return POSITION_STEP
  const lastPos = last[0]!.goalPosition
  if (lastPos === undefined) return Date.now()
  return lastPos + POSITION_STEP
}

function validateCostDays(costDays: number | null) {
  if (costDays === null) return
  if (!Number.isFinite(costDays) || costDays <= 0) {
    throw new ConvexError('costDays must be a positive number of days')
  }
}

const encode = (value: unknown): string => JSON.stringify(value)

function taskAssigneeIds(task: Doc<'tasks'>): Id<'users'>[] {
  if (task.assigneeUserIds && task.assigneeUserIds.length > 0) {
    return task.assigneeUserIds
  }
  return [task.assigneeUserId]
}

function assertCanEditTask(task: Doc<'tasks'> | null, userId: Id<'users'>): asserts task is Doc<'tasks'> {
  if (!task) {
    throw new ConvexError('Task not found')
  }
  if (task.creatorId === userId) return
  if (taskAssigneeIds(task).includes(userId)) return
  throw new ConvexError('Forbidden')
}

type DiffableField =
  | 'title'
  | 'description'
  | 'status'
  | 'softDeadline'
  | 'hardDeadline'
  | 'estimateMinutes'
  | 'goalId'
  | 'costDays'

const DIFF_FIELDS: readonly DiffableField[] = [
  'title',
  'description',
  'status',
  'softDeadline',
  'hardDeadline',
  'estimateMinutes',
  'goalId',
  'costDays',
]

// Fields added after launch may be absent on older rows; treat undefined as
// null when diffing.
const OPTIONAL_DIFF_FIELDS = new Set<DiffableField>(['goalId', 'costDays'])

type TaskChange = { field: string; before: string | null; after: string | null }

type UpdateArgs = {
  title?: string
  description?: string | null
  status?: Doc<'tasks'>['status']
  softDeadline?: number | null
  hardDeadline?: number | null
  estimateMinutes?: number | null
  goalId?: Id<'goals'> | null
  costDays?: number | null
}

function diffFields(task: Doc<'tasks'>, args: UpdateArgs) {
  const changes: TaskChange[] = []
  const patch: Record<string, unknown> = {}
  for (const field of DIFF_FIELDS) {
    const next = args[field]
    if (next === undefined) continue
    const current = OPTIONAL_DIFF_FIELDS.has(field) ? (task[field] ?? null) : task[field]
    if (current === next) continue
    changes.push({ field, before: current === null ? null : encode(current), after: next === null ? null : encode(next) })
    patch[field] = next
  }
  return { changes, patch }
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    softDeadline: v.optional(v.union(v.number(), v.null())),
    hardDeadline: v.optional(v.union(v.number(), v.null())),
    estimateMinutes: v.optional(v.union(v.number(), v.null())),
    goalId: v.optional(v.union(v.id('goals'), v.null())),
    costDays: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const title = args.title.trim()
    if (!title) {
      throw new ConvexError('Title is required')
    }
    const trimmedDescription = args.description?.trim() ?? ''
    const description = trimmedDescription === '' ? null : trimmedDescription
    const softDeadline = args.softDeadline ?? null
    const hardDeadline = args.hardDeadline ?? null
    const estimateMinutes = args.estimateMinutes ?? null
    const goalId = args.goalId ?? null
    const costDays = args.costDays ?? null
    if (softDeadline !== null && hardDeadline !== null && softDeadline > hardDeadline) {
      throw new ConvexError('softDeadline must be on or before hardDeadline')
    }
    validateCostDays(costDays)
    await assertOwnsGoal(ctx, goalId, userId)
    const goalPosition = goalId === null ? undefined : await nextGoalTailPosition(ctx, goalId)
    const now = Date.now()
    const taskId = await ctx.db.insert('tasks', {
      title,
      description,
      creatorId: userId,
      assigneeUserId: userId,
      assigneeUserIds: [userId],
      status: 'open',
      completedAt: null,
      softDeadline,
      hardDeadline,
      estimateMinutes,
      goalId,
      goalPosition,
      costDays,
      updatedAt: now,
    })
    const changes: TaskChange[] = [
      { field: 'title', before: null, after: encode(title) },
      { field: 'status', before: null, after: encode('open') },
      { field: 'assigneeUserId', before: null, after: encode(userId) },
    ]
    if (description !== null) {
      changes.push({ field: 'description', before: null, after: encode(description) })
    }
    if (softDeadline !== null) {
      changes.push({ field: 'softDeadline', before: null, after: encode(softDeadline) })
    }
    if (hardDeadline !== null) {
      changes.push({ field: 'hardDeadline', before: null, after: encode(hardDeadline) })
    }
    if (estimateMinutes !== null) {
      changes.push({ field: 'estimateMinutes', before: null, after: encode(estimateMinutes) })
    }
    if (goalId !== null) {
      changes.push({ field: 'goalId', before: null, after: encode(goalId) })
    }
    if (costDays !== null) {
      changes.push({ field: 'costDays', before: null, after: encode(costDays) })
    }
    await ctx.db.insert('taskEvents', {
      taskId,
      actorId: userId,
      kind: 'created',
      changes,
    })
    return taskId
  },
})

export const update = mutation({
  args: {
    id: v.id('tasks'),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    status: v.optional(taskStatus),
    softDeadline: v.optional(v.union(v.number(), v.null())),
    hardDeadline: v.optional(v.union(v.number(), v.null())),
    estimateMinutes: v.optional(v.union(v.number(), v.null())),
    goalId: v.optional(v.union(v.id('goals'), v.null())),
    costDays: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const task = await ctx.db.get(args.id)
    assertCanEditTask(task, userId)

    const normalized: UpdateArgs = {}
    if (args.title !== undefined) {
      const trimmed = args.title.trim()
      if (!trimmed) {
        throw new ConvexError('Title is required')
      }
      normalized.title = trimmed
    }
    if (args.description !== undefined) {
      if (args.description === null) {
        normalized.description = null
      } else {
        const trimmed = args.description.trim()
        normalized.description = trimmed === '' ? null : trimmed
      }
    }
    if (args.status !== undefined) normalized.status = args.status
    if (args.softDeadline !== undefined) normalized.softDeadline = args.softDeadline
    if (args.hardDeadline !== undefined) normalized.hardDeadline = args.hardDeadline
    if (args.estimateMinutes !== undefined) normalized.estimateMinutes = args.estimateMinutes
    if (args.goalId !== undefined) {
      await assertOwnsGoal(ctx, args.goalId, userId)
      normalized.goalId = args.goalId
    }
    if (args.costDays !== undefined) {
      validateCostDays(args.costDays)
      normalized.costDays = args.costDays
    }

    const { changes, patch } = diffFields(task, normalized)

    if (normalized.goalId !== undefined && normalized.goalId !== (task.goalId ?? null)) {
      patch.goalPosition =
        normalized.goalId === null
          ? undefined
          : await nextGoalTailPosition(ctx, normalized.goalId)
    }

    if (normalized.status !== undefined) {
      const now = Date.now()
      if (normalized.status === 'done' && task.status !== 'done') {
        changes.push({ field: 'completedAt', before: null, after: encode(now) })
        patch.completedAt = now
      } else if (normalized.status !== 'done' && task.status === 'done') {
        changes.push({
          field: 'completedAt',
          before: task.completedAt === null ? null : encode(task.completedAt),
          after: null,
        })
        patch.completedAt = null
      }
    }

    const nextSoft =
      normalized.softDeadline !== undefined ? normalized.softDeadline : task.softDeadline
    const nextHard =
      normalized.hardDeadline !== undefined ? normalized.hardDeadline : task.hardDeadline
    if (nextSoft !== null && nextHard !== null && nextSoft > nextHard) {
      throw new ConvexError('softDeadline must be on or before hardDeadline')
    }

    if (changes.length === 0) {
      return { changed: false }
    }

    const now = Date.now()
    await ctx.db.patch(args.id, { ...patch, updatedAt: now })
    await ctx.db.insert('taskEvents', {
      taskId: args.id,
      actorId: userId,
      kind: 'updated',
      changes,
    })
    return { changed: true }
  },
})

export const remove = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const task = await ctx.db.get(args.id)
    assertCanEditTask(task, userId)

    const snapshot: TaskChange[] = [
      { field: 'title', before: encode(task.title), after: null },
      {
        field: 'description',
        before: task.description === null ? null : encode(task.description),
        after: null,
      },
      { field: 'status', before: encode(task.status), after: null },
      { field: 'assigneeUserId', before: encode(task.assigneeUserId), after: null },
      {
        field: 'completedAt',
        before: task.completedAt === null ? null : encode(task.completedAt),
        after: null,
      },
      {
        field: 'softDeadline',
        before: task.softDeadline === null ? null : encode(task.softDeadline),
        after: null,
      },
      {
        field: 'hardDeadline',
        before: task.hardDeadline === null ? null : encode(task.hardDeadline),
        after: null,
      },
      {
        field: 'estimateMinutes',
        before: task.estimateMinutes === null ? null : encode(task.estimateMinutes),
        after: null,
      },
    ]
    await ctx.db.insert('taskEvents', {
      taskId: args.id,
      actorId: userId,
      kind: 'deleted',
      changes: snapshot,
    })
    await ctx.db.delete(args.id)
  },
})

export type TaskAssignee = {
  userId: Id<'users'>
  name: string
  email: string
  imageUrl: string | null
}

export type TaskListItem = Doc<'tasks'> & {
  assignees: TaskAssignee[]
}

async function hydrateAssignees(
  ctx: QueryCtx,
  tasks: Doc<'tasks'>[],
): Promise<TaskListItem[]> {
  const ids = new Set<Id<'users'>>()
  for (const task of tasks) {
    for (const id of taskAssigneeIds(task)) ids.add(id)
  }
  const cache = new Map<Id<'users'>, TaskAssignee>()
  await Promise.all(
    Array.from(ids).map(async (id) => {
      const user = await ctx.db.get(id)
      if (!user) return
      cache.set(id, {
        userId: id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl ?? null,
      })
    }),
  )
  return tasks.map((task) => ({
    ...task,
    assignees: taskAssigneeIds(task)
      .map((id) => cache.get(id))
      .filter((a): a is TaskAssignee => a !== undefined),
  }))
}

export const list = query({
  args: {
    status: v.optional(taskStatus),
  },
  handler: async (ctx, args): Promise<TaskListItem[]> => {
    const userId = await requireUserId(ctx)
    const status = args.status
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_assignee_status', (q) =>
        status ? q.eq('assigneeUserId', userId).eq('status', status) : q.eq('assigneeUserId', userId),
      )
      .order('desc')
      .take(200)
    return await hydrateAssignees(ctx, tasks)
  },
})

export const get = query({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const task = await ctx.db.get(args.id)
    assertCanEditTask(task, userId)
    return task
  },
})

export const history = query({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const task = await ctx.db.get(args.taskId)
    assertCanEditTask(task, userId)
    return await ctx.db
      .query('taskEvents')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .order('desc')
      .take(100)
  },
})
