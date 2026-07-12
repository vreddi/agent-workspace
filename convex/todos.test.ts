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

describe('todos.create', () => {
  test('creates an incomplete todo with a trimmed title', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await asUser.mutation(api.todos.create, { title: '  Buy milk  ' })
    const todos = await asUser.query(api.todos.list, {})
    expect(todos).toHaveLength(1)
    expect(todos[0]).toMatchObject({ _id: id, title: 'Buy milk', completed: false })
  })

  test('rejects a blank title', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(asUser.mutation(api.todos.create, { title: '   ' })).rejects.toThrowError(
      /Title is required/,
    )
  })
})

describe('todos.list', () => {
  test('returns the caller\'s todos newest first and excludes others', async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    await asAlice.mutation(api.todos.create, { title: 'first' })
    await asAlice.mutation(api.todos.create, { title: 'second' })
    await asBob.mutation(api.todos.create, { title: 'bob-only' })

    const aliceTodos = await asAlice.query(api.todos.list, {})
    expect(aliceTodos.map((todo) => todo.title)).toEqual(['second', 'first'])

    const bobTodos = await asBob.query(api.todos.list, {})
    expect(bobTodos.map((todo) => todo.title)).toEqual(['bob-only'])
  })

  test('list is bounded to 200 rows', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const userId = await t.run(async (ctx) => {
      const user = await ctx.db
        .query('users')
        .withIndex('by_externalId', (q) => q.eq('externalId', 'user_1'))
        .unique()
      return user!._id
    })
    await t.run(async (ctx) => {
      for (let i = 0; i < 205; i++) {
        await ctx.db.insert('todos', { userId, title: `todo-${i}`, completed: false })
      }
    })
    const todos = await asUser.query(api.todos.list, {})
    expect(todos).toHaveLength(200)
  })
})

describe('todos.toggle', () => {
  test('flips the completed flag', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await asUser.mutation(api.todos.create, { title: 'task' })
    await asUser.mutation(api.todos.toggle, { id })
    expect((await asUser.query(api.todos.list, {}))[0].completed).toBe(true)
    await asUser.mutation(api.todos.toggle, { id })
    expect((await asUser.query(api.todos.list, {}))[0].completed).toBe(false)
  })

  test('cannot toggle another user\'s todo', async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    const id = await asAlice.mutation(api.todos.create, { title: 'alice task' })
    await expect(asBob.mutation(api.todos.toggle, { id })).rejects.toThrowError(
      /Todo not found/,
    )
  })
})

describe('todos.remove', () => {
  test('deletes the caller\'s todo', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await asUser.mutation(api.todos.create, { title: 'task' })
    await asUser.mutation(api.todos.remove, { id })
    expect(await asUser.query(api.todos.list, {})).toHaveLength(0)
  })

  test('cannot remove another user\'s todo', async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    const id = await asAlice.mutation(api.todos.create, { title: 'alice task' })
    await expect(asBob.mutation(api.todos.remove, { id })).rejects.toThrowError(
      /Todo not found/,
    )
    expect(await asAlice.query(api.todos.list, {})).toHaveLength(1)
  })
})

describe('todos auth enforcement', () => {
  test('unauthenticated callers are rejected', async () => {
    const t = setup()
    await expect(t.query(api.todos.list, {})).rejects.toThrowError(/Not authenticated/)
    await expect(
      t.mutation(api.todos.create, { title: 'nope' }),
    ).rejects.toThrowError(/Not authenticated/)
  })
})
