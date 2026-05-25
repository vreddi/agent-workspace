import { ConvexError, v } from 'convex/values'
import { mutation, query, QueryCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { getCurrentUser } from './users'

const POSITION_STEP = 1024

async function requireUserId(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throw new ConvexError('Not authenticated')
  }
  return user._id
}

function assertCanEditGroup(
  group: Doc<'taskGroups'> | null,
  userId: Id<'users'>,
): asserts group is Doc<'taskGroups'> {
  if (!group) {
    throw new ConvexError('Group not found')
  }
  if (group.creatorId !== userId) {
    throw new ConvexError('Forbidden')
  }
}

async function nextTailPosition(
  ctx: QueryCtx,
  userId: Id<'users'>,
): Promise<number> {
  const last = await ctx.db
    .query('taskGroups')
    .withIndex('by_creator_archived_position', (q) =>
      q.eq('creatorId', userId).eq('archivedAt', null),
    )
    .order('desc')
    .take(1)
  if (last.length === 0) return POSITION_STEP
  return last[0]!.position + POSITION_STEP
}

export const list = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    if (args.includeArchived) {
      return await ctx.db
        .query('taskGroups')
        .withIndex('by_creator', (q) => q.eq('creatorId', userId))
        .take(500)
    }
    return await ctx.db
      .query('taskGroups')
      .withIndex('by_creator_archived_position', (q) =>
        q.eq('creatorId', userId).eq('archivedAt', null),
      )
      .take(500)
  },
})

export const get = query({
  args: { id: v.id('taskGroups') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const group = await ctx.db.get(args.id)
    assertCanEditGroup(group, userId)
    return group
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
    iconImageUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const name = args.name.trim()
    if (!name) throw new ConvexError('Name is required')
    const trimmedDescription = args.description?.trim() ?? ''
    const description = trimmedDescription === '' ? null : trimmedDescription
    const trimmedIcon = args.icon?.trim() ?? ''
    const icon = trimmedIcon === '' ? null : trimmedIcon
    const color = args.color?.trim() || 'indigo'
    const iconImageUrl =
      args.iconImageUrl === undefined || args.iconImageUrl === null
        ? null
        : args.iconImageUrl.trim() === ''
          ? null
          : args.iconImageUrl.trim()
    const position = await nextTailPosition(ctx, userId)
    const now = Date.now()
    return await ctx.db.insert('taskGroups', {
      creatorId: userId,
      name,
      description,
      color,
      icon,
      iconImageUrl,
      position,
      archivedAt: null,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('taskGroups'),
    name: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    color: v.optional(v.string()),
    icon: v.optional(v.union(v.string(), v.null())),
    iconImageUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const group = await ctx.db.get(args.id)
    assertCanEditGroup(group, userId)
    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) {
      const trimmed = args.name.trim()
      if (!trimmed) throw new ConvexError('Name is required')
      patch.name = trimmed
    }
    if (args.description !== undefined) {
      if (args.description === null) {
        patch.description = null
      } else {
        const trimmed = args.description.trim()
        patch.description = trimmed === '' ? null : trimmed
      }
    }
    if (args.color !== undefined) {
      const trimmed = args.color.trim()
      if (trimmed) patch.color = trimmed
    }
    if (args.icon !== undefined) {
      if (args.icon === null) {
        patch.icon = null
      } else {
        const trimmed = args.icon.trim()
        patch.icon = trimmed === '' ? null : trimmed
      }
    }
    if (args.iconImageUrl !== undefined) {
      if (args.iconImageUrl === null) {
        patch.iconImageUrl = null
      } else {
        const trimmed = args.iconImageUrl.trim()
        patch.iconImageUrl = trimmed === '' ? null : trimmed
      }
    }
    if (Object.keys(patch).length === 0) return { changed: false }
    patch.updatedAt = Date.now()
    await ctx.db.patch(args.id, patch)
    return { changed: true }
  },
})

export const archive = mutation({
  args: { id: v.id('taskGroups') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const group = await ctx.db.get(args.id)
    assertCanEditGroup(group, userId)
    if (group.archivedAt !== null) return { changed: false }
    await ctx.db.patch(args.id, { archivedAt: Date.now(), updatedAt: Date.now() })
    return { changed: true }
  },
})

export const unarchive = mutation({
  args: { id: v.id('taskGroups') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const group = await ctx.db.get(args.id)
    assertCanEditGroup(group, userId)
    if (group.archivedAt === null) return { changed: false }
    const position = await nextTailPosition(ctx, userId)
    await ctx.db.patch(args.id, { archivedAt: null, position, updatedAt: Date.now() })
    return { changed: true }
  },
})

export const remove = mutation({
  args: { id: v.id('taskGroups') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const group = await ctx.db.get(args.id)
    assertCanEditGroup(group, userId)
    // Re-home tasks to inbox. Batched in 100s to stay inside transaction limits;
    // groups with thousands of tasks should call this from a paginated action.
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_group_position', (q) => q.eq('groupId', args.id))
      .take(100)
    for (const task of tasks) {
      await ctx.db.patch(task._id, { groupId: null, updatedAt: Date.now() })
    }
    if (tasks.length === 100) {
      throw new ConvexError(
        'Group has too many tasks to delete in one transaction. Move tasks out first.',
      )
    }
    await ctx.db.delete(args.id)
  },
})

async function nextGroupTaskTailPosition(
  ctx: QueryCtx,
  groupId: Id<'taskGroups'>,
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

export const addTasks = mutation({
  args: {
    groupId: v.id('taskGroups'),
    taskIds: v.array(v.id('tasks')),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const group = await ctx.db.get(args.groupId)
    assertCanEditGroup(group, userId)
    if (args.taskIds.length === 0) return { moved: 0 }
    if (args.taskIds.length > 100) {
      throw new ConvexError('Cannot move more than 100 tasks at once')
    }
    let position = await nextGroupTaskTailPosition(ctx, args.groupId)
    const now = Date.now()
    let moved = 0
    for (const taskId of args.taskIds) {
      const task = await ctx.db.get(taskId)
      if (!task) continue
      const assignees = task.assigneeUserIds ?? [task.assigneeUserId]
      if (task.creatorId !== userId && !assignees.includes(userId)) continue
      // Only adopt tasks not already in this group; silently skip the no-ops.
      if ((task.groupId ?? null) === args.groupId) continue
      await ctx.db.patch(taskId, {
        groupId: args.groupId,
        groupPosition: position,
        updatedAt: now,
      })
      await ctx.db.insert('taskEvents', {
        taskId,
        actorId: userId,
        kind: 'updated',
        changes: [
          {
            field: 'groupId',
            before: task.groupId ? JSON.stringify(task.groupId) : null,
            after: JSON.stringify(args.groupId),
          },
        ],
      })
      position += POSITION_STEP
      moved += 1
    }
    return { moved }
  },
})

export const reorder = mutation({
  args: {
    id: v.id('taskGroups'),
    beforeId: v.union(v.id('taskGroups'), v.null()),
    afterId: v.union(v.id('taskGroups'), v.null()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const group = await ctx.db.get(args.id)
    assertCanEditGroup(group, userId)
    const before = args.beforeId ? await ctx.db.get(args.beforeId) : null
    const after = args.afterId ? await ctx.db.get(args.afterId) : null
    if (before && before.creatorId !== userId) throw new ConvexError('Forbidden')
    if (after && after.creatorId !== userId) throw new ConvexError('Forbidden')
    let nextPosition: number
    if (before && after) {
      nextPosition = (before.position + after.position) / 2
    } else if (before) {
      nextPosition = before.position + POSITION_STEP
    } else if (after) {
      nextPosition = after.position - POSITION_STEP
    } else {
      nextPosition = POSITION_STEP
    }
    await ctx.db.patch(args.id, { position: nextPosition, updatedAt: Date.now() })
    return { position: nextPosition }
  },
})
