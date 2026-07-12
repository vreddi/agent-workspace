import { ConvexError, v } from 'convex/values'
import { mutation, query, QueryCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { requireUserId } from './lib/auth'
import { goalStatus } from './schema'
import { systemGoalType, SystemGoalType } from './goalTypes'
import { canUserEditTask, syncAssignmentStatus } from './taskAssignments'

const POSITION_STEP = 1024
const DAY_MS = 24 * 60 * 60 * 1000

// Reminders may begin at most this many days before the deadline; the
// reminder cron scans this far ahead.
export const MAX_REMINDER_DAYS_BEFORE = 90
export const DEFAULT_REMINDER_DAYS_BEFORE = 7

// The kanban board has three stages. They are a projection of task.status —
// tasks carry no separate board state. Cancelled tasks fall off the board.
export const GOAL_BOARD_STAGES = ['inactive', 'active', 'complete'] as const
export type GoalBoardStage = (typeof GOAL_BOARD_STAGES)[number]

const STAGE_TO_STATUS: Record<GoalBoardStage, Doc<'tasks'>['status']> = {
  inactive: 'open',
  active: 'in_progress',
  complete: 'done',
}

export function boardStageForStatus(
  status: Doc<'tasks'>['status'],
): GoalBoardStage | null {
  switch (status) {
    case 'open':
      return 'inactive'
    case 'in_progress':
      return 'active'
    case 'done':
      return 'complete'
    case 'cancelled':
      return null
  }
}

const boardStage = v.union(
  v.literal('inactive'),
  v.literal('active'),
  v.literal('complete'),
)

// Exported so sibling modules (e.g. metrics.ts) authorize goal-scoped writes
// through the exact same ownership rule. Kept as a one-way import — goals.ts
// never imports from those modules — to avoid a require cycle.
export function assertCanEditGoal(
  goal: Doc<'goals'> | null,
  userId: Id<'users'>,
): asserts goal is Doc<'goals'> {
  if (!goal) {
    throw new ConvexError('Goal not found')
  }
  if (goal.creatorId !== userId) {
    throw new ConvexError('Forbidden')
  }
}

type GoalTypeArgs = {
  typeSlug?: string | null
  customTypeId?: Id<'goalTypes'> | null
}

// Normalizes and authorizes the mutually exclusive type reference.
async function resolveTypeArgs(
  ctx: QueryCtx,
  userId: Id<'users'>,
  args: GoalTypeArgs,
): Promise<{ typeSlug: string | null; customTypeId: Id<'goalTypes'> | null }> {
  const typeSlug = args.typeSlug ?? null
  const customTypeId = args.customTypeId ?? null
  if (typeSlug !== null && customTypeId !== null) {
    throw new ConvexError(
      'A goal can have a system type or a custom type, not both',
    )
  }
  if (typeSlug !== null && systemGoalType(typeSlug) === null) {
    throw new ConvexError('Unknown system goal type')
  }
  if (customTypeId !== null) {
    const type = await ctx.db.get(customTypeId)
    if (!type || type.creatorId !== userId) {
      throw new ConvexError('Goal type not found')
    }
  }
  return { typeSlug, customTypeId }
}

function validateReminderDaysBefore(days: number) {
  if (!Number.isInteger(days) || days < 1 || days > MAX_REMINDER_DAYS_BEFORE) {
    throw new ConvexError(
      `reminderDaysBefore must be a whole number between 1 and ${MAX_REMINDER_DAYS_BEFORE}`,
    )
  }
}

export type GoalTypeInfo =
  | { kind: 'system'; slug: string; name: string; color: string; icon: string }
  | {
      kind: 'custom'
      id: Id<'goalTypes'>
      name: string
      color: string
      icon: string | null
    }
  | null

async function resolveTypeInfo(
  ctx: QueryCtx,
  goal: Doc<'goals'>,
): Promise<GoalTypeInfo> {
  if (goal.typeSlug !== null) {
    const type: SystemGoalType | null = systemGoalType(goal.typeSlug)
    if (!type) return null
    return {
      kind: 'system',
      slug: type.slug,
      name: type.name,
      color: type.color,
      icon: type.icon,
    }
  }
  if (goal.customTypeId !== null) {
    const type = await ctx.db.get(goal.customTypeId)
    if (!type) return null
    return {
      kind: 'custom',
      id: type._id,
      name: type.name,
      color: type.color,
      icon: type.icon,
    }
  }
  return null
}

export type GoalProgress = {
  totalTasks: number
  inactiveTasks: number
  activeTasks: number
  completeTasks: number
  // Cost totals in days, summed over non-cancelled tasks with a cost set.
  totalCostDays: number
  completeCostDays: number
  remainingCostDays: number
  // Non-cancelled tasks with no costDays — the totals above undercount by these.
  uncostedTasks: number
}

async function goalTasks(ctx: QueryCtx, goalId: Id<'goals'>) {
  return await ctx.db
    .query('tasks')
    .withIndex('by_goal_position', (q) => q.eq('goalId', goalId))
    .take(500)
}

function computeProgress(tasks: Doc<'tasks'>[]): GoalProgress {
  const progress: GoalProgress = {
    totalTasks: 0,
    inactiveTasks: 0,
    activeTasks: 0,
    completeTasks: 0,
    totalCostDays: 0,
    completeCostDays: 0,
    remainingCostDays: 0,
    uncostedTasks: 0,
  }
  for (const task of tasks) {
    const stage = boardStageForStatus(task.status)
    if (stage === null) continue
    progress.totalTasks += 1
    if (stage === 'inactive') progress.inactiveTasks += 1
    if (stage === 'active') progress.activeTasks += 1
    if (stage === 'complete') progress.completeTasks += 1
    const cost = task.costDays ?? null
    if (cost === null) {
      progress.uncostedTasks += 1
      continue
    }
    progress.totalCostDays += cost
    if (stage === 'complete') progress.completeCostDays += cost
  }
  progress.remainingCostDays =
    progress.totalCostDays - progress.completeCostDays
  return progress
}

export type GoalListItem = Doc<'goals'> & {
  type: GoalTypeInfo
  progress: GoalProgress
}

async function hydrateGoal(
  ctx: QueryCtx,
  goal: Doc<'goals'>,
): Promise<GoalListItem> {
  const [type, tasks] = await Promise.all([
    resolveTypeInfo(ctx, goal),
    goalTasks(ctx, goal._id),
  ])
  return { ...goal, type, progress: computeProgress(tasks) }
}

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    deadline: v.number(),
    typeSlug: v.optional(v.union(v.string(), v.null())),
    customTypeId: v.optional(v.union(v.id('goalTypes'), v.null())),
    reminderDaysBefore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const title = args.title.trim()
    if (!title) {
      throw new ConvexError('Title is required')
    }
    const trimmedDescription = args.description?.trim() ?? ''
    const description = trimmedDescription === '' ? null : trimmedDescription
    if (args.deadline <= Date.now()) {
      throw new ConvexError('Deadline must be in the future')
    }
    const reminderDaysBefore =
      args.reminderDaysBefore ?? DEFAULT_REMINDER_DAYS_BEFORE
    validateReminderDaysBefore(reminderDaysBefore)
    const { typeSlug, customTypeId } = await resolveTypeArgs(ctx, userId, args)
    return await ctx.db.insert('goals', {
      creatorId: userId,
      title,
      description,
      deadline: args.deadline,
      status: 'active',
      achievedAt: null,
      typeSlug,
      customTypeId,
      reminderDaysBefore,
      lastRemindedAt: null,
      updatedAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('goals'),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    deadline: v.optional(v.number()),
    typeSlug: v.optional(v.union(v.string(), v.null())),
    customTypeId: v.optional(v.union(v.id('goalTypes'), v.null())),
    reminderDaysBefore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const goal = await ctx.db.get(args.id)
    assertCanEditGoal(goal, userId)
    const patch: Record<string, unknown> = {}
    if (args.title !== undefined) {
      const trimmed = args.title.trim()
      if (!trimmed) throw new ConvexError('Title is required')
      patch.title = trimmed
    }
    if (args.description !== undefined) {
      if (args.description === null) {
        patch.description = null
      } else {
        const trimmed = args.description.trim()
        patch.description = trimmed === '' ? null : trimmed
      }
    }
    if (args.deadline !== undefined) {
      patch.deadline = args.deadline
      // Deadline moved: let the reminder cron re-evaluate from scratch.
      patch.lastRemindedAt = null
    }
    if (args.reminderDaysBefore !== undefined) {
      validateReminderDaysBefore(args.reminderDaysBefore)
      patch.reminderDaysBefore = args.reminderDaysBefore
    }
    if (args.typeSlug !== undefined || args.customTypeId !== undefined) {
      const { typeSlug, customTypeId } = await resolveTypeArgs(ctx, userId, {
        typeSlug: args.typeSlug ?? null,
        customTypeId: args.customTypeId ?? null,
      })
      patch.typeSlug = typeSlug
      patch.customTypeId = customTypeId
    }
    if (Object.keys(patch).length === 0) return { changed: false }
    patch.updatedAt = Date.now()
    await ctx.db.patch(args.id, patch)
    return { changed: true }
  },
})

export const setStatus = mutation({
  args: { id: v.id('goals'), status: goalStatus },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const goal = await ctx.db.get(args.id)
    assertCanEditGoal(goal, userId)
    if (goal.status === args.status) return { changed: false }
    const now = Date.now()
    await ctx.db.patch(args.id, {
      status: args.status,
      achievedAt: args.status === 'achieved' ? now : null,
      updatedAt: now,
    })
    return { changed: true }
  },
})

export const list = query({
  args: { status: v.optional(goalStatus) },
  handler: async (ctx, args): Promise<GoalListItem[]> => {
    const userId = await requireUserId(ctx)
    const status = args.status ?? 'active'
    const goals = await ctx.db
      .query('goals')
      .withIndex('by_creator_status', (q) =>
        q.eq('creatorId', userId).eq('status', status),
      )
      .order('desc')
      .take(100)
    // Sort active goals by nearest deadline first; other statuses keep
    // newest-first creation order.
    const ordered =
      status === 'active'
        ? [...goals].sort((a, b) => a.deadline - b.deadline)
        : goals
    return await Promise.all(ordered.map((goal) => hydrateGoal(ctx, goal)))
  },
})

export const get = query({
  args: { id: v.id('goals') },
  handler: async (ctx, args): Promise<GoalListItem> => {
    const userId = await requireUserId(ctx)
    const goal = await ctx.db.get(args.id)
    assertCanEditGoal(goal, userId)
    return await hydrateGoal(ctx, goal)
  },
})

export type GoalBoard = {
  inactive: Doc<'tasks'>[]
  active: Doc<'tasks'>[]
  complete: Doc<'tasks'>[]
}

export const board = query({
  args: { id: v.id('goals') },
  handler: async (ctx, args): Promise<GoalBoard> => {
    const userId = await requireUserId(ctx)
    const goal = await ctx.db.get(args.id)
    assertCanEditGoal(goal, userId)
    const tasks = await goalTasks(ctx, args.id)
    const columns: GoalBoard = { inactive: [], active: [], complete: [] }
    for (const task of tasks) {
      const stage = boardStageForStatus(task.status)
      if (stage !== null) columns[stage].push(task)
    }
    return columns
  },
})

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

export const addTasks = mutation({
  args: {
    goalId: v.id('goals'),
    taskIds: v.array(v.id('tasks')),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const goal = await ctx.db.get(args.goalId)
    assertCanEditGoal(goal, userId)
    if (args.taskIds.length === 0) return { moved: 0 }
    if (args.taskIds.length > 100) {
      throw new ConvexError('Cannot move more than 100 tasks at once')
    }
    let position = await nextGoalTailPosition(ctx, args.goalId)
    const now = Date.now()
    let moved = 0
    for (const taskId of args.taskIds) {
      const task = await ctx.db.get(taskId)
      if (!task || !(await canUserEditTask(ctx, task, userId))) continue
      if ((task.goalId ?? null) === args.goalId) continue
      await ctx.db.patch(taskId, {
        goalId: args.goalId,
        goalPosition: position,
        updatedAt: now,
      })
      await ctx.db.insert('taskEvents', {
        taskId,
        actorId: userId,
        kind: 'updated',
        changes: [
          {
            field: 'goalId',
            before: task.goalId ? JSON.stringify(task.goalId) : null,
            after: JSON.stringify(args.goalId),
          },
        ],
      })
      position += POSITION_STEP
      moved += 1
    }
    return { moved }
  },
})

export const removeTask = mutation({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task || !(await canUserEditTask(ctx, task, userId))) {
      throw new ConvexError('Task not found')
    }
    const goalId = task.goalId ?? null
    if (goalId === null) return { changed: false }
    await ctx.db.patch(args.taskId, { goalId: null, updatedAt: Date.now() })
    await ctx.db.insert('taskEvents', {
      taskId: args.taskId,
      actorId: userId,
      kind: 'updated',
      changes: [
        { field: 'goalId', before: JSON.stringify(goalId), after: null },
      ],
    })
    return { changed: true }
  },
})

// Moves a task to a kanban stage (updating its status) and orders it between
// its new neighbors within the goal board.
export const moveTask = mutation({
  args: {
    taskId: v.id('tasks'),
    stage: boardStage,
    beforeId: v.optional(v.union(v.id('tasks'), v.null())),
    afterId: v.optional(v.union(v.id('tasks'), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const task = await ctx.db.get(args.taskId)
    if (!task || !(await canUserEditTask(ctx, task, userId))) {
      throw new ConvexError('Task not found')
    }
    const goalId = task.goalId ?? null
    if (goalId === null) {
      throw new ConvexError('Task is not attached to a goal')
    }
    const goal = await ctx.db.get(goalId)
    assertCanEditGoal(goal, userId)

    const before = args.beforeId ? await ctx.db.get(args.beforeId) : null
    const after = args.afterId ? await ctx.db.get(args.afterId) : null
    if (before && (before.goalId ?? null) !== goalId)
      throw new ConvexError('Forbidden')
    if (after && (after.goalId ?? null) !== goalId)
      throw new ConvexError('Forbidden')
    const beforePos = before?.goalPosition
    const afterPos = after?.goalPosition
    let nextPosition: number
    if (beforePos !== undefined && afterPos !== undefined) {
      nextPosition = (beforePos + afterPos) / 2
    } else if (beforePos !== undefined) {
      nextPosition = beforePos + POSITION_STEP
    } else if (afterPos !== undefined) {
      nextPosition = afterPos - POSITION_STEP
    } else {
      nextPosition = await nextGoalTailPosition(ctx, goalId)
    }

    const now = Date.now()
    const nextStatus = STAGE_TO_STATUS[args.stage]
    const patch: Record<string, unknown> = {
      goalPosition: nextPosition,
      updatedAt: now,
    }
    if (task.status !== nextStatus) {
      patch.status = nextStatus
      patch.completedAt = nextStatus === 'done' ? now : null
      await ctx.db.insert('taskEvents', {
        taskId: args.taskId,
        actorId: userId,
        kind: 'updated',
        changes: [
          {
            field: 'status',
            before: JSON.stringify(task.status),
            after: JSON.stringify(nextStatus),
          },
        ],
      })
    }
    await ctx.db.patch(args.taskId, patch)
    if (task.status !== nextStatus) {
      await syncAssignmentStatus(ctx, args.taskId, nextStatus)
    }
    return { goalPosition: nextPosition, status: nextStatus }
  },
})

export const remove = mutation({
  args: { id: v.id('goals') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const goal = await ctx.db.get(args.id)
    assertCanEditGoal(goal, userId)
    // Detach tasks back to no-goal. Batched to stay inside transaction limits;
    // goals with hundreds of tasks should move tasks out first.
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_goal_position', (q) => q.eq('goalId', args.id))
      .take(100)
    for (const task of tasks) {
      await ctx.db.patch(task._id, { goalId: null, updatedAt: Date.now() })
    }
    if (tasks.length === 100) {
      throw new ConvexError(
        'Goal has too many tasks to delete in one transaction. Move tasks out first.',
      )
    }
    // Reminders for a deleted goal are meaningless; clear them out.
    while (true) {
      const reminders = await ctx.db
        .query('goalReminders')
        .withIndex('by_goal', (q) => q.eq('goalId', args.id))
        .take(100)
      for (const reminder of reminders) {
        await ctx.db.delete(reminder._id)
      }
      if (reminders.length < 100) break
    }
    // Metrics and their readings are owned by the goal — cascade them out.
    // Inlined (rather than importing metrics.ts) so goals.ts stays free of a
    // back-import and the module graph acyclic.
    while (true) {
      const metrics = await ctx.db
        .query('metrics')
        .withIndex('by_goal', (q) => q.eq('goalId', args.id))
        .take(100)
      for (const metric of metrics) {
        while (true) {
          const points = await ctx.db
            .query('metricPoints')
            .withIndex('by_metric_at', (q) => q.eq('metricId', metric._id))
            .take(200)
          for (const point of points) {
            await ctx.db.delete(point._id)
          }
          if (points.length < 200) break
        }
        await ctx.db.delete(metric._id)
      }
      if (metrics.length < 100) break
    }
    await ctx.db.delete(args.id)
  },
})

export { DAY_MS }
