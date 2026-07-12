/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

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

function createGoal(asUser: UserClient) {
  return asUser.mutation(api.goals.create, {
    title: 'Run a marathon',
    deadline: Date.now() + 90 * DAY_MS,
  })
}

describe('tasks.create with goal fields', () => {
  test('stores goalId and costDays and records them in history', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Train weekly',
      goalId,
      costDays: 1.5,
    })
    const task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task).toMatchObject({ goalId, costDays: 1.5 })
    expect(task?.goalPosition).toBeTypeOf('number')

    const history = await asUser.query(api.tasks.history, { taskId })
    const created = history.find((e) => e.kind === 'created')
    const fields = created!.changes.map((c) => c.field)
    expect(fields).toContain('goalId')
    expect(fields).toContain('costDays')
  })

  test('rejects non-positive costDays', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(
      asUser.mutation(api.tasks.create, { title: 'Bad', costDays: 0 }),
    ).rejects.toThrowError(/costDays/)
    await expect(
      asUser.mutation(api.tasks.create, { title: 'Bad', costDays: -2 }),
    ).rejects.toThrowError(/costDays/)
  })

  test("rejects attaching to another user's goal", async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    const goalId = await createGoal(asAlice)
    await expect(
      asBob.mutation(api.tasks.create, { title: 'Sneaky', goalId }),
    ).rejects.toThrowError(/Forbidden/)
  })
})

describe('tasks.update with goal fields', () => {
  test('attaching to a goal assigns a board position; detaching clears it', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Train weekly',
    })

    await asUser.mutation(api.tasks.update, { id: taskId, goalId })
    let task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task?.goalId).toBe(goalId)
    expect(task?.goalPosition).toBeTypeOf('number')

    await asUser.mutation(api.tasks.update, { id: taskId, goalId: null })
    task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task?.goalId).toBeNull()
  })

  test('updates costDays and diffs it into history', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Train weekly',
      costDays: 2,
    })
    const result = await asUser.mutation(api.tasks.update, {
      id: taskId,
      costDays: 4,
    })
    expect(result).toEqual({ changed: true })

    // No-op update reports unchanged.
    const noop = await asUser.mutation(api.tasks.update, {
      id: taskId,
      costDays: 4,
    })
    expect(noop).toEqual({ changed: false })

    const history = await asUser.query(api.tasks.history, { taskId })
    const updated = history.find((e) => e.kind === 'updated')
    expect(updated!.changes).toEqual([
      { field: 'costDays', before: '2', after: '4' },
    ])
  })
})
