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

describe('tasks progressPercent (long-running tasks)', () => {
  test('create stores progress and records it in history', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Read Attached',
      estimateMinutes: 16 * 60,
      progressPercent: 0,
    })
    const task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task.progressPercent).toBe(0)

    const history = await asUser.query(api.tasks.history, { taskId })
    const created = history.find((e) => e.kind === 'created')
    expect(created!.changes.map((c) => c.field)).toContain('progressPercent')
  })

  test('defaults to null (not a long-running task)', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, { title: 'Bare' })
    const task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task.progressPercent).toBeNull()
  })

  test('rejects out-of-range or fractional progress', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    for (const progressPercent of [-1, 101, 12.5]) {
      await expect(
        asUser.mutation(api.tasks.create, { title: 'Bad', progressPercent }),
      ).rejects.toThrowError(/progressPercent/)
    }
    const taskId = await asUser.mutation(api.tasks.create, { title: 'Ok' })
    await expect(
      asUser.mutation(api.tasks.update, { id: taskId, progressPercent: 120 }),
    ).rejects.toThrowError(/progressPercent/)
  })

  test('update moves progress, records diffs, and clearing stops tracking', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Read the book',
      progressPercent: 20,
    })

    const first = await asUser.mutation(api.tasks.update, {
      id: taskId,
      progressPercent: 50,
    })
    expect(first).toEqual({ changed: true })
    let task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task.progressPercent).toBe(50)

    const second = await asUser.mutation(api.tasks.update, {
      id: taskId,
      progressPercent: null,
    })
    expect(second).toEqual({ changed: true })
    task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task.progressPercent).toBeNull()

    const history = await asUser.query(api.tasks.history, { taskId })
    const updates = history.filter((e) => e.kind === 'updated')
    const fields = updates.flatMap((e) => e.changes.map((c) => c.field))
    expect(fields.filter((f) => f === 'progressPercent')).toHaveLength(2)
  })

  test('no-op progress update reports changed: false', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Steady',
      progressPercent: 40,
    })
    const result = await asUser.mutation(api.tasks.update, {
      id: taskId,
      progressPercent: 40,
    })
    expect(result).toEqual({ changed: false })
  })

  test('marking a long-running task done snaps progress to 100', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, {
      title: 'Read the book',
      progressPercent: 70,
    })
    await asUser.mutation(api.tasks.update, { id: taskId, status: 'done' })
    const task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task.status).toBe('done')
    expect(task.progressPercent).toBe(100)
  })

  test('marking a normal task done leaves progress untracked', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const taskId = await asUser.mutation(api.tasks.create, { title: 'Quick' })
    await asUser.mutation(api.tasks.update, { id: taskId, status: 'done' })
    const task = await asUser.query(api.tasks.get, { id: taskId })
    expect(task.progressPercent).toBeNull()
  })
})
