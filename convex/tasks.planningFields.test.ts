/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

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

describe('tasks.create with planning fields', () => {
  test('stores priority, difficulty, and time slot and records them in history', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Write launch post',
      priority: 'high',
      difficulty: 4,
      scheduledStartMinutes: 9 * 60,
    })
    const task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task).toMatchObject({
      priority: 'high',
      difficulty: 4,
      scheduledStartMinutes: 540,
    })

    const history = await asUser.query(api.tasks.history, { taskId })
    const created = history.find((e) => e.kind === 'created')
    const fields = created!.changes.map((c) => c.field)
    expect(fields).toContain('priority')
    expect(fields).toContain('difficulty')
    expect(fields).toContain('scheduledStartMinutes')
  })

  test('defaults all planning fields to null', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, { title: 'Bare' })
    const task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task).toMatchObject({
      priority: null,
      difficulty: null,
      scheduledStartMinutes: null,
    })
  })

  test('rejects out-of-range difficulty', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(
      asUser.mutation(api.tasks.create, { title: 'Bad', difficulty: 0 }),
    ).rejects.toThrowError(/difficulty/)
    await expect(
      asUser.mutation(api.tasks.create, { title: 'Bad', difficulty: 6 }),
    ).rejects.toThrowError(/difficulty/)
    await expect(
      asUser.mutation(api.tasks.create, { title: 'Bad', difficulty: 2.5 }),
    ).rejects.toThrowError(/difficulty/)
  })

  test('rejects out-of-range time slot', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(
      asUser.mutation(api.tasks.create, {
        title: 'Bad',
        scheduledStartMinutes: -15,
      }),
    ).rejects.toThrowError(/scheduledStartMinutes/)
    await expect(
      asUser.mutation(api.tasks.create, {
        title: 'Bad',
        scheduledStartMinutes: 24 * 60,
      }),
    ).rejects.toThrowError(/scheduledStartMinutes/)
  })
})

describe('tasks.update with planning fields', () => {
  test('updates fields and records diffs; clearing works', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Plan sprint',
      priority: 'low',
    })

    const first = await asUser.mutation(api.tasks.update, {
      id: taskId,
      priority: 'medium',
      difficulty: 2,
      scheduledStartMinutes: 13 * 60 + 30,
    })
    expect(first).toEqual({ changed: true })

    let task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task).toMatchObject({
      priority: 'medium',
      difficulty: 2,
      scheduledStartMinutes: 810,
    })

    const second = await asUser.mutation(api.tasks.update, {
      id: taskId,
      priority: null,
      scheduledStartMinutes: null,
    })
    expect(second).toEqual({ changed: true })
    task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task).toMatchObject({
      priority: null,
      difficulty: 2,
      scheduledStartMinutes: null,
    })

    const history = await asUser.query(api.tasks.history, { taskId })
    const updates = history.filter((e) => e.kind === 'updated')
    const updatedFields = updates.flatMap((e) => e.changes.map((c) => c.field))
    expect(updatedFields).toContain('priority')
    expect(updatedFields).toContain('difficulty')
    expect(updatedFields).toContain('scheduledStartMinutes')
  })

  test('no-op update reports changed: false', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Steady',
      priority: 'high',
      difficulty: 3,
    })
    const result = await asUser.mutation(api.tasks.update, {
      id: taskId,
      priority: 'high',
      difficulty: 3,
      scheduledStartMinutes: null,
    })
    expect(result).toEqual({ changed: false })
  })

  test('rejects invalid difficulty on update', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, { title: 'Task' })
    await expect(
      asUser.mutation(api.tasks.update, { id: taskId, difficulty: 9 }),
    ).rejects.toThrowError(/difficulty/)
  })
})
