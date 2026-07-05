import { ConvexError, v } from 'convex/values'
import { mutation, query, QueryCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { getCurrentUser } from './users'
import { taskPriority, taskStatus } from './schema'
import {
  assigneeIdsForTask,
  canUserEditTask,
  deleteAssignmentsForTask,
  normalizeAssigneeIds,
  syncAssignmentStatus,
} from './taskAssignments'

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

function validateDifficulty(difficulty: number | null) {
  if (difficulty === null) return
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new ConvexError('difficulty must be an integer from 1 (easy) to 5 (challenging)')
  }
}

function validateScheduledStartMinutes(minutes: number | null) {
  if (minutes === null) return
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= 24 * 60) {
    throw new ConvexError('scheduledStartMinutes must be a whole number of minutes within the day (0–1439)')
  }
}

const encode = (value: unknown): string => JSON.stringify(value)

async function requireEditableTask(
  ctx: QueryCtx,
  taskId: Id<'tasks'>,
  userId: Id<'users'>,
): Promise<Doc<'tasks'>> {
  const task = await ctx.db.get(taskId)
  if (!task) {
    throw new ConvexError('Task not found')
  }
  if (!(await canUserEditTask(ctx, task, userId))) {
    throw new ConvexError('Forbidden')
  }
  return task
}

type DiffableField =
  | 'title'
  | 'description'
  | 'emoji'
  | 'status'
  | 'softDeadline'
  | 'hardDeadline'
  | 'estimateMinutes'
  | 'priority'
  | 'difficulty'
  | 'scheduledStartMinutes'
  | 'goalId'
  | 'costDays'

const DIFF_FIELDS: readonly DiffableField[] = [
  'title',
  'description',
  'emoji',
  'status',
  'softDeadline',
  'hardDeadline',
  'estimateMinutes',
  'priority',
  'difficulty',
  'scheduledStartMinutes',
  'goalId',
  'costDays',
]

// Fields added after launch may be absent on older rows; treat undefined as
// null when diffing.
const OPTIONAL_DIFF_FIELDS = new Set<DiffableField>([
  'emoji',
  'priority',
  'difficulty',
  'scheduledStartMinutes',
  'goalId',
  'costDays',
])

type TaskChange = { field: string; before: string | null; after: string | null }

type UpdateArgs = {
  title?: string
  description?: string | null
  emoji?: string | null
  status?: Doc<'tasks'>['status']
  softDeadline?: number | null
  hardDeadline?: number | null
  estimateMinutes?: number | null
  priority?: 'high' | 'medium' | 'low' | null
  difficulty?: number | null
  scheduledStartMinutes?: number | null
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
    emoji: v.optional(v.union(v.string(), v.null())),
    softDeadline: v.optional(v.union(v.number(), v.null())),
    hardDeadline: v.optional(v.union(v.number(), v.null())),
    estimateMinutes: v.optional(v.union(v.number(), v.null())),
    priority: v.optional(v.union(taskPriority, v.null())),
    difficulty: v.optional(v.union(v.number(), v.null())),
    scheduledStartMinutes: v.optional(v.union(v.number(), v.null())),
    goalId: v.optional(v.union(v.id('goals'), v.null())),
    costDays: v.optional(v.union(v.number(), v.null())),
    // Who works on it. Omitted = you; may be any accounts, with or without you.
    assigneeIds: v.optional(v.array(v.id('users'))),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const title = args.title.trim()
    if (!title) {
      throw new ConvexError('Title is required')
    }
    const trimmedDescription = args.description?.trim() ?? ''
    const description = trimmedDescription === '' ? null : trimmedDescription
    const emoji = args.emoji?.trim() || null
    const softDeadline = args.softDeadline ?? null
    const hardDeadline = args.hardDeadline ?? null
    const estimateMinutes = args.estimateMinutes ?? null
    const priority = args.priority ?? null
    const difficulty = args.difficulty ?? null
    const scheduledStartMinutes = args.scheduledStartMinutes ?? null
    const goalId = args.goalId ?? null
    const costDays = args.costDays ?? null
    if (softDeadline !== null && hardDeadline !== null && softDeadline > hardDeadline) {
      throw new ConvexError('softDeadline must be on or before hardDeadline')
    }
    validateDifficulty(difficulty)
    validateScheduledStartMinutes(scheduledStartMinutes)
    validateCostDays(costDays)
    await assertOwnsGoal(ctx, goalId, userId)
    const assigneeIds = normalizeAssigneeIds(args.assigneeIds ?? [userId])
    const assigneeNames: string[] = []
    for (const assigneeId of assigneeIds) {
      const assignee = await ctx.db.get(assigneeId)
      if (!assignee) throw new ConvexError('Assignee not found')
      assigneeNames.push(assignee.name.trim() || assignee.email)
    }
    const goalPosition = goalId === null ? undefined : await nextGoalTailPosition(ctx, goalId)
    const now = Date.now()
    const taskId = await ctx.db.insert('tasks', {
      title,
      description,
      emoji,
      creatorId: userId,
      status: 'open',
      completedAt: null,
      softDeadline,
      hardDeadline,
      estimateMinutes,
      priority,
      difficulty,
      scheduledStartMinutes,
      goalId,
      goalPosition,
      costDays,
      updatedAt: now,
    })
    for (const assigneeId of assigneeIds) {
      await ctx.db.insert('taskAssignments', {
        taskId,
        userId: assigneeId,
        assignedById: userId,
        status: 'open',
      })
    }
    const changes: TaskChange[] = [
      { field: 'title', before: null, after: encode(title) },
      { field: 'status', before: null, after: encode('open') },
      { field: 'assignees', before: null, after: encode(assigneeNames) },
    ]
    if (description !== null) {
      changes.push({ field: 'description', before: null, after: encode(description) })
    }
    if (emoji !== null) {
      changes.push({ field: 'emoji', before: null, after: encode(emoji) })
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
    if (priority !== null) {
      changes.push({ field: 'priority', before: null, after: encode(priority) })
    }
    if (difficulty !== null) {
      changes.push({ field: 'difficulty', before: null, after: encode(difficulty) })
    }
    if (scheduledStartMinutes !== null) {
      changes.push({ field: 'scheduledStartMinutes', before: null, after: encode(scheduledStartMinutes) })
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
    emoji: v.optional(v.union(v.string(), v.null())),
    status: v.optional(taskStatus),
    softDeadline: v.optional(v.union(v.number(), v.null())),
    hardDeadline: v.optional(v.union(v.number(), v.null())),
    estimateMinutes: v.optional(v.union(v.number(), v.null())),
    priority: v.optional(v.union(taskPriority, v.null())),
    difficulty: v.optional(v.union(v.number(), v.null())),
    scheduledStartMinutes: v.optional(v.union(v.number(), v.null())),
    goalId: v.optional(v.union(v.id('goals'), v.null())),
    costDays: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const task = await requireEditableTask(ctx, args.id, userId)

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
    if (args.emoji !== undefined) {
      normalized.emoji = args.emoji === null ? null : args.emoji.trim() || null
    }
    if (args.status !== undefined) normalized.status = args.status
    if (args.softDeadline !== undefined) normalized.softDeadline = args.softDeadline
    if (args.hardDeadline !== undefined) normalized.hardDeadline = args.hardDeadline
    if (args.estimateMinutes !== undefined) normalized.estimateMinutes = args.estimateMinutes
    if (args.priority !== undefined) normalized.priority = args.priority
    if (args.difficulty !== undefined) {
      validateDifficulty(args.difficulty)
      normalized.difficulty = args.difficulty
    }
    if (args.scheduledStartMinutes !== undefined) {
      validateScheduledStartMinutes(args.scheduledStartMinutes)
      normalized.scheduledStartMinutes = args.scheduledStartMinutes
    }
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
    if (typeof patch.status === 'string') {
      await syncAssignmentStatus(ctx, args.id, patch.status as Doc<'tasks'>['status'])
    }
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
    if (!task) {
      throw new ConvexError('Task not found')
    }
    // Deleting is destructive for everyone on the task, so only its creator
    // may do it; an assignee who wants out removes themselves via
    // taskAssignments.setAssignees instead.
    if (task.creatorId !== userId) {
      throw new ConvexError('Only the task creator can delete it')
    }

    const snapshot: TaskChange[] = [
      { field: 'title', before: encode(task.title), after: null },
      {
        field: 'description',
        before: task.description === null ? null : encode(task.description),
        after: null,
      },
      { field: 'status', before: encode(task.status), after: null },
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
    await deleteAssignmentsForTask(ctx, args.id)
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
  const idsByTask = new Map<Id<'tasks'>, Id<'users'>[]>()
  const ids = new Set<Id<'users'>>()
  await Promise.all(
    tasks.map(async (task) => {
      const assigneeIds = await assigneeIdsForTask(ctx, task)
      idsByTask.set(task._id, assigneeIds)
      for (const id of assigneeIds) ids.add(id)
    }),
  )
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
    assignees: (idsByTask.get(task._id) ?? [])
      .map((id) => cache.get(id))
      .filter((a): a is TaskAssignee => a !== undefined),
  }))
}

const LIST_LIMIT = 200

// Your task list is the union of what you're assigned to and what you
// created (so a task you delegated entirely doesn't vanish on you). The
// legacy by_assignee_status scan covers rows written before the
// taskAssignments table existed and not yet backfilled.
export const list = query({
  args: {
    status: v.optional(taskStatus),
  },
  handler: async (ctx, args): Promise<TaskListItem[]> => {
    const userId = await requireUserId(ctx)
    const status = args.status

    const assignments = await ctx.db
      .query('taskAssignments')
      .withIndex('by_user_and_status', (q) =>
        status ? q.eq('userId', userId).eq('status', status) : q.eq('userId', userId),
      )
      .order('desc')
      .take(LIST_LIMIT)
    const assigned = await Promise.all(assignments.map((row) => ctx.db.get(row.taskId)))
    const legacyAssigned = await ctx.db
      .query('tasks')
      .withIndex('by_assignee_status', (q) =>
        status ? q.eq('assigneeUserId', userId).eq('status', status) : q.eq('assigneeUserId', userId),
      )
      .order('desc')
      .take(LIST_LIMIT)
    const created = await ctx.db
      .query('tasks')
      .withIndex('by_creator_status', (q) =>
        status ? q.eq('creatorId', userId).eq('status', status) : q.eq('creatorId', userId),
      )
      .order('desc')
      .take(LIST_LIMIT)

    const byId = new Map<Id<'tasks'>, Doc<'tasks'>>()
    for (const task of [...assigned, ...legacyAssigned, ...created]) {
      if (task) byId.set(task._id, task)
    }
    const tasks = Array.from(byId.values())
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, LIST_LIMIT)
    return await hydrateAssignees(ctx, tasks)
  },
})

// Compact goal summary attached to a task detail so the task page can show
// and link the goal it belongs to without a second round-trip.
export type TaskGoalSummary = {
  _id: Id<'goals'>
  title: string
  status: Doc<'goals'>['status']
  deadline: number
  typeSlug: string | null
  customTypeId: Id<'goalTypes'> | null
}

export type TaskDetail = Doc<'tasks'> & {
  goal: TaskGoalSummary | null
  assignees: TaskAssignee[]
  viewerIsCreator: boolean
  viewerId: Id<'users'>
}

export const get = query({
  args: { id: v.id('tasks') },
  handler: async (ctx, args): Promise<TaskDetail> => {
    const userId = await requireUserId(ctx)
    const task = await requireEditableTask(ctx, args.id, userId)
    let goal: TaskGoalSummary | null = null
    if (task.goalId) {
      const doc = await ctx.db.get(task.goalId)
      if (doc) {
        goal = {
          _id: doc._id,
          title: doc.title,
          status: doc.status,
          deadline: doc.deadline,
          typeSlug: doc.typeSlug,
          customTypeId: doc.customTypeId,
        }
      }
    }
    const hydrated = await hydrateAssignees(ctx, [task])
    return {
      ...task,
      goal,
      assignees: hydrated[0]?.assignees ?? [],
      viewerIsCreator: task.creatorId === userId,
      viewerId: userId,
    }
  },
})

export type TaskHistoryEvent = Doc<'taskEvents'> & {
  actorName: string
  actorIsYou: boolean
}

export const history = query({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args): Promise<TaskHistoryEvent[]> => {
    const userId = await requireUserId(ctx)
    await requireEditableTask(ctx, args.taskId, userId)
    const events = await ctx.db
      .query('taskEvents')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .order('desc')
      .take(100)
    const names = new Map<Id<'users'>, string>()
    for (const event of events) {
      if (names.has(event.actorId)) continue
      const actor = await ctx.db.get(event.actorId)
      names.set(event.actorId, actor?.name.trim() || actor?.email || 'Someone')
    }
    return events.map((event) => ({
      ...event,
      actorName: names.get(event.actorId) ?? 'Someone',
      actorIsYou: event.actorId === userId,
    }))
  },
})
