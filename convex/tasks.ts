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

async function assertOwnsGroup(
  ctx: QueryCtx,
  groupId: Id<'taskGroups'> | null,
  userId: Id<'users'>,
) {
  if (groupId === null) return
  const group = await ctx.db.get(groupId)
  if (!group) throw new ConvexError('Group not found')
  if (group.creatorId !== userId) throw new ConvexError('Forbidden')
}

async function nextGroupTailPosition(
  ctx: QueryCtx,
  groupId: Id<'taskGroups'> | null,
): Promise<number> {
  const last = await ctx.db
    .query('tasks')
    .withIndex('by_group_position', (q) => q.eq('groupId', groupId))
    .order('desc')
    .take(1)
  if (last.length === 0) return POSITION_STEP
  const lastPos = last[0]!.groupPosition
  if (lastPos === undefined) return Date.now()
  return lastPos + POSITION_STEP
}

const encode = (value: unknown): string => JSON.stringify(value)

function assertCanEditTask(task: Doc<'tasks'> | null, userId: Id<'users'>): asserts task is Doc<'tasks'> {
  if (!task) {
    throw new ConvexError('Task not found')
  }
  if (task.creatorId !== userId && task.assigneeUserId !== userId) {
    throw new ConvexError('Forbidden')
  }
}

type DiffableField =
  | 'title'
  | 'description'
  | 'status'
  | 'softDeadline'
  | 'hardDeadline'
  | 'estimateMinutes'
  | 'groupId'

const DIFF_FIELDS: readonly DiffableField[] = [
  'title',
  'description',
  'status',
  'softDeadline',
  'hardDeadline',
  'estimateMinutes',
  'groupId',
]

type TaskChange = { field: string; before: string | null; after: string | null }

type UpdateArgs = {
  title?: string
  description?: string | null
  status?: Doc<'tasks'>['status']
  softDeadline?: number | null
  hardDeadline?: number | null
  estimateMinutes?: number | null
  groupId?: Id<'taskGroups'> | null
}

function diffFields(task: Doc<'tasks'>, args: UpdateArgs) {
  const changes: TaskChange[] = []
  const patch: Record<string, unknown> = {}
  for (const field of DIFF_FIELDS) {
    const next = args[field]
    if (next === undefined) continue
    // Older rows may have no groupId field at all; treat undefined as null for diffs.
    const current = field === 'groupId' ? (task.groupId ?? null) : task[field]
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
    groupId: v.optional(v.union(v.id('taskGroups'), v.null())),
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
    const groupId = args.groupId ?? null
    if (softDeadline !== null && hardDeadline !== null && softDeadline > hardDeadline) {
      throw new ConvexError('softDeadline must be on or before hardDeadline')
    }
    await assertOwnsGroup(ctx, groupId, userId)
    const groupPosition = await nextGroupTailPosition(ctx, groupId)
    const now = Date.now()
    const taskId = await ctx.db.insert('tasks', {
      title,
      description,
      creatorId: userId,
      assigneeUserId: userId,
      status: 'open',
      completedAt: null,
      softDeadline,
      hardDeadline,
      estimateMinutes,
      groupId,
      groupPosition,
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
    if (groupId !== null) {
      changes.push({ field: 'groupId', before: null, after: encode(groupId) })
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
    groupId: v.optional(v.union(v.id('taskGroups'), v.null())),
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
    if (args.groupId !== undefined) {
      await assertOwnsGroup(ctx, args.groupId, userId)
      normalized.groupId = args.groupId
    }

    const { changes, patch } = diffFields(task, normalized)

    if (normalized.groupId !== undefined && normalized.groupId !== (task.groupId ?? null)) {
      patch.groupPosition = await nextGroupTailPosition(ctx, normalized.groupId)
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

export const list = query({
  args: {
    status: v.optional(taskStatus),
    // null = Inbox (ungrouped). Omit field = all groups.
    groupId: v.optional(v.union(v.id('taskGroups'), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const status = args.status
    if (args.groupId !== undefined) {
      const groupId = args.groupId
      return await ctx.db
        .query('tasks')
        .withIndex('by_assignee_group_status', (q) =>
          status
            ? q.eq('assigneeUserId', userId).eq('groupId', groupId).eq('status', status)
            : q.eq('assigneeUserId', userId).eq('groupId', groupId),
        )
        .order('desc')
        .take(200)
    }
    return await ctx.db
      .query('tasks')
      .withIndex('by_assignee_status', (q) =>
        status ? q.eq('assigneeUserId', userId).eq('status', status) : q.eq('assigneeUserId', userId),
      )
      .order('desc')
      .take(200)
  },
})

export const listUngrouped = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    // Only open/in_progress ungrouped tasks — what the user is likely to want to file.
    const rows = await ctx.db
      .query('tasks')
      .withIndex('by_assignee_group_status', (q) =>
        q.eq('assigneeUserId', userId).eq('groupId', null),
      )
      .order('desc')
      .take(200)
    return rows.filter((t) => t.status === 'open' || t.status === 'in_progress')
  },
})

export const reorder = mutation({
  args: {
    id: v.id('tasks'),
    groupId: v.union(v.id('taskGroups'), v.null()),
    beforeId: v.union(v.id('tasks'), v.null()),
    afterId: v.union(v.id('tasks'), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const task = await ctx.db.get(args.id)
    assertCanEditTask(task, userId)
    await assertOwnsGroup(ctx, args.groupId, userId)
    const before = args.beforeId ? await ctx.db.get(args.beforeId) : null
    const after = args.afterId ? await ctx.db.get(args.afterId) : null
    if (before && before.assigneeUserId !== userId) throw new ConvexError('Forbidden')
    if (after && after.assigneeUserId !== userId) throw new ConvexError('Forbidden')
    const beforePos = before?.groupPosition
    const afterPos = after?.groupPosition
    let nextPosition: number
    if (beforePos !== undefined && afterPos !== undefined) {
      nextPosition = (beforePos + afterPos) / 2
    } else if (beforePos !== undefined) {
      nextPosition = beforePos + POSITION_STEP
    } else if (afterPos !== undefined) {
      nextPosition = afterPos - POSITION_STEP
    } else {
      nextPosition = await nextGroupTailPosition(ctx, args.groupId)
    }
    const patch: Record<string, unknown> = {
      groupPosition: nextPosition,
      updatedAt: Date.now(),
    }
    if ((task.groupId ?? null) !== args.groupId) {
      patch.groupId = args.groupId
    }
    await ctx.db.patch(args.id, patch)
    return { groupPosition: nextPosition }
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
