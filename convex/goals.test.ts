/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import { Id } from './_generated/dataModel'
import schema from './schema'
import { DEFAULT_REMINDER_DAYS_BEFORE } from './goals'

const modules = import.meta.glob('./**/*.ts')

const DAY_MS = 24 * 60 * 60 * 1000

function setup() {
  return convexTest(schema, modules)
}

async function signUp(t: ReturnType<typeof setup>, externalId: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert('users', {
      externalId,
      email: `${externalId}@example.com`,
      name: externalId,
    })
  })
  return t.withIdentity({ subject: externalId })
}

type UserClient = Awaited<ReturnType<typeof signUp>>

function createGoal(
  asUser: UserClient,
  overrides: Record<string, unknown> = {},
) {
  return asUser.mutation(api.goals.create, {
    title: 'Run a marathon',
    deadline: Date.now() + 90 * DAY_MS,
    ...overrides,
  })
}

describe('goals.create', () => {
  test('creates an active goal with defaults', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const deadline = Date.now() + 90 * DAY_MS
    const id = await createGoal(asUser, {
      deadline,
      description: '  Become a runner  ',
    })
    const goal = await asUser.query(api.goals.get, { id })
    expect(goal).toMatchObject({
      title: 'Run a marathon',
      description: 'Become a runner',
      deadline,
      status: 'active',
      achievedAt: null,
      typeSlug: null,
      customTypeId: null,
      reminderDaysBefore: DEFAULT_REMINDER_DAYS_BEFORE,
      lastRemindedAt: null,
      type: null,
    })
    expect(goal.progress.totalTasks).toBe(0)
  })

  test('rejects blank titles and past deadlines', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(createGoal(asUser, { title: '  ' })).rejects.toThrowError(
      /Title is required/,
    )
    await expect(
      createGoal(asUser, { deadline: Date.now() - 1 }),
    ).rejects.toThrowError(/Deadline must be in the future/)
  })

  test('accepts a system type by slug', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await createGoal(asUser, { typeSlug: 'fitness' })
    const goal = await asUser.query(api.goals.get, { id })
    expect(goal.type).toMatchObject({
      kind: 'system',
      slug: 'fitness',
      name: 'Fitness',
    })
  })

  test('rejects unknown system slugs', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(
      createGoal(asUser, { typeSlug: 'time-travel' }),
    ).rejects.toThrowError(/Unknown system goal type/)
  })

  test('accepts a custom type and resolves it', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const typeId = await asUser.mutation(api.goalTypes.create, {
      name: 'Side Projects',
      color: 'violet',
    })
    const id = await createGoal(asUser, { customTypeId: typeId })
    const goal = await asUser.query(api.goals.get, { id })
    expect(goal.type).toMatchObject({
      kind: 'custom',
      id: typeId,
      name: 'Side Projects',
    })
  })

  test('rejects setting both a system and a custom type', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const typeId = await asUser.mutation(api.goalTypes.create, {
      name: 'Side Projects',
    })
    await expect(
      createGoal(asUser, { typeSlug: 'fitness', customTypeId: typeId }),
    ).rejects.toThrowError(/not both/)
  })

  test("rejects another user's custom type", async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    const typeId = await asAlice.mutation(api.goalTypes.create, {
      name: 'Side Projects',
    })
    await expect(
      createGoal(asBob, { customTypeId: typeId }),
    ).rejects.toThrowError(/Goal type not found/)
  })

  test('validates reminderDaysBefore bounds', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(
      createGoal(asUser, { reminderDaysBefore: 0 }),
    ).rejects.toThrowError(/reminderDaysBefore/)
    await expect(
      createGoal(asUser, { reminderDaysBefore: 91 }),
    ).rejects.toThrowError(/reminderDaysBefore/)
    await expect(
      createGoal(asUser, { reminderDaysBefore: 2.5 }),
    ).rejects.toThrowError(/reminderDaysBefore/)
  })
})

describe('goals.update', () => {
  test('updates fields and switches type kinds', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await createGoal(asUser, { typeSlug: 'fitness' })
    const typeId = await asUser.mutation(api.goalTypes.create, {
      name: 'Side Projects',
    })
    await asUser.mutation(api.goals.update, {
      id,
      title: 'Run an ultramarathon',
      customTypeId: typeId,
    })
    const goal = await asUser.query(api.goals.get, { id })
    expect(goal.title).toBe('Run an ultramarathon')
    expect(goal.typeSlug).toBeNull()
    expect(goal.type).toMatchObject({ kind: 'custom', id: typeId })
  })

  test('moving the deadline resets the reminder cursor', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await createGoal(asUser)
    await t.run(async (ctx) => {
      await ctx.db.patch(id, { lastRemindedAt: Date.now() })
    })
    await asUser.mutation(api.goals.update, {
      id,
      deadline: Date.now() + 10 * DAY_MS,
    })
    const goal = await asUser.query(api.goals.get, { id })
    expect(goal.lastRemindedAt).toBeNull()
  })

  test("cannot update another user's goal", async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    const id = await createGoal(asAlice)
    await expect(
      asBob.mutation(api.goals.update, { id, title: 'Hijacked' }),
    ).rejects.toThrowError(/Forbidden/)
  })
})

describe('goals.setStatus', () => {
  test('achieving stamps achievedAt; reactivating clears it', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await createGoal(asUser)
    await asUser.mutation(api.goals.setStatus, { id, status: 'achieved' })
    let goal = await asUser.query(api.goals.get, { id })
    expect(goal.status).toBe('achieved')
    expect(goal.achievedAt).not.toBeNull()
    await asUser.mutation(api.goals.setStatus, { id, status: 'active' })
    goal = await asUser.query(api.goals.get, { id })
    expect(goal.status).toBe('active')
    expect(goal.achievedAt).toBeNull()
  })
})

describe('goals.list', () => {
  test('filters by status and sorts active goals by nearest deadline', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const far = await createGoal(asUser, {
      title: 'Far',
      deadline: Date.now() + 90 * DAY_MS,
    })
    const near = await createGoal(asUser, {
      title: 'Near',
      deadline: Date.now() + 5 * DAY_MS,
    })
    const achieved = await createGoal(asUser, { title: 'Done' })
    await asUser.mutation(api.goals.setStatus, {
      id: achieved,
      status: 'achieved',
    })

    const active = await asUser.query(api.goals.list, {})
    expect(active.map((g) => g._id)).toEqual([near, far])
    const achievedList = await asUser.query(api.goals.list, {
      status: 'achieved',
    })
    expect(achievedList.map((g) => g._id)).toEqual([achieved])
  })

  test("does not leak other users' goals", async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    await createGoal(asAlice)
    expect(await asBob.query(api.goals.list, {})).toEqual([])
  })
})

async function createTask(
  asUser: UserClient,
  title: string,
  extra: Record<string, unknown> = {},
) {
  return await asUser.mutation(api.tasks.create, { title, ...extra })
}

describe('goal kanban board', () => {
  test('addTasks attaches tasks and board maps status to stages', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const a = await createTask(asUser, 'Buy shoes')
    const b = await createTask(asUser, 'Train weekly')
    const c = await createTask(asUser, 'Sign up for race')
    const { moved } = await asUser.mutation(api.goals.addTasks, {
      goalId,
      taskIds: [a, b, c],
    })
    expect(moved).toBe(3)

    // New tasks are 'open' → inactive column.
    let board = await asUser.query(api.goals.board, { id: goalId })
    expect(board.inactive.map((t) => t._id)).toEqual([a, b, c])
    expect(board.active).toEqual([])
    expect(board.complete).toEqual([])

    await asUser.mutation(api.tasks.update, { id: b, status: 'in_progress' })
    await asUser.mutation(api.tasks.update, { id: c, status: 'done' })
    board = await asUser.query(api.goals.board, { id: goalId })
    expect(board.inactive.map((t) => t._id)).toEqual([a])
    expect(board.active.map((t) => t._id)).toEqual([b])
    expect(board.complete.map((t) => t._id)).toEqual([c])
  })

  test('cancelled tasks fall off the board', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const a = await createTask(asUser, 'Buy shoes', { goalId })
    await asUser.mutation(api.tasks.update, { id: a, status: 'cancelled' })
    const board = await asUser.query(api.goals.board, { id: goalId })
    expect(board).toEqual({ inactive: [], active: [], complete: [] })
  })

  test('moveTask changes stage, stamps completedAt, and orders between neighbors', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const a = await createTask(asUser, 'A', { goalId })
    const b = await createTask(asUser, 'B', { goalId })
    const c = await createTask(asUser, 'C', { goalId })

    // Complete a task.
    const result = await asUser.mutation(api.goals.moveTask, {
      taskId: a,
      stage: 'complete',
    })
    expect(result.status).toBe('done')
    const completed = await asUser.query(api.tasks.get, { id: a })
    expect(completed?.completedAt).not.toBeNull()

    // Move C between... B has neighbors: reorder C before B within inactive.
    await asUser.mutation(api.goals.moveTask, {
      taskId: c,
      stage: 'inactive',
      beforeId: null,
      afterId: b,
    })
    const board = await asUser.query(api.goals.board, { id: goalId })
    expect(board.inactive.map((t) => t._id)).toEqual([c, b])
    expect(board.complete.map((t) => t._id)).toEqual([a])

    // Moving back out of complete clears completedAt.
    await asUser.mutation(api.goals.moveTask, { taskId: a, stage: 'active' })
    const reopened = await asUser.query(api.tasks.get, { id: a })
    expect(reopened?.status).toBe('in_progress')
    expect(reopened?.completedAt).toBeNull()
  })

  test('moveTask rejects tasks not attached to a goal', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await createGoal(asUser)
    const a = await createTask(asUser, 'Loose task')
    await expect(
      asUser.mutation(api.goals.moveTask, { taskId: a, stage: 'active' }),
    ).rejects.toThrowError(/not attached to a goal/)
  })

  test('removeTask detaches a task from its goal', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const a = await createTask(asUser, 'A', { goalId })
    await asUser.mutation(api.goals.removeTask, { taskId: a })
    const board = await asUser.query(api.goals.board, { id: goalId })
    expect(board).toEqual({ inactive: [], active: [], complete: [] })
    const task = await asUser.query(api.tasks.get, { id: a })
    expect(task?.goalId).toBeNull()
  })
})

describe('goal cost progress', () => {
  test('sums costDays and splits complete vs remaining', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    await createTask(asUser, 'A', { goalId, costDays: 2 })
    const b = await createTask(asUser, 'B', { goalId, costDays: 3.5 })
    await createTask(asUser, 'C', { goalId }) // uncosted
    const cancelled = await createTask(asUser, 'D', { goalId, costDays: 10 })
    await asUser.mutation(api.tasks.update, { id: b, status: 'done' })
    await asUser.mutation(api.tasks.update, {
      id: cancelled,
      status: 'cancelled',
    })

    const goal = await asUser.query(api.goals.get, { id: goalId })
    expect(goal.progress).toEqual({
      totalTasks: 3,
      inactiveTasks: 2,
      activeTasks: 0,
      completeTasks: 1,
      totalCostDays: 5.5,
      completeCostDays: 3.5,
      remainingCostDays: 2,
      uncostedTasks: 1,
    })
  })

  test('time estimate stands in as cost; costDays overrides it', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    // Estimate only → counts as cost (720 min = 0.5 day).
    await createTask(asUser, 'A', { goalId, estimateMinutes: 720 })
    // Both set → explicit costDays wins, estimate ignored.
    await createTask(asUser, 'B', {
      goalId,
      costDays: 2,
      estimateMinutes: 999,
    })
    // Neither → uncosted.
    await createTask(asUser, 'C', { goalId })

    const goal = await asUser.query(api.goals.get, { id: goalId })
    expect(goal.progress.totalCostDays).toBe(2.5)
    expect(goal.progress.remainingCostDays).toBe(2.5)
    expect(goal.progress.uncostedTasks).toBe(1)
  })
})

describe('goals.remove', () => {
  test('detaches tasks and deletes reminders with the goal', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const a = await createTask(asUser, 'A', { goalId })
    await t.run(async (ctx) => {
      const goal = await ctx.db.get(goalId)
      await ctx.db.insert('goalReminders', {
        goalId,
        userId: goal!.creatorId,
        kind: 'approaching',
        goalTitle: goal!.title,
        deadline: goal!.deadline,
        daysRemaining: 3,
        readAt: null,
      })
    })

    await asUser.mutation(api.goals.remove, { id: goalId })

    const task = await asUser.query(api.tasks.get, { id: a })
    expect(task?.goalId).toBeNull()
    const reminders = await t.run(async (ctx) => {
      return await ctx.db
        .query('goalReminders')
        .withIndex('by_goal', (q) => q.eq('goalId', goalId as Id<'goals'>))
        .take(10)
    })
    expect(reminders).toEqual([])
    await expect(
      asUser.query(api.goals.get, { id: goalId }),
    ).rejects.toThrowError(/Goal not found/)
  })
})
