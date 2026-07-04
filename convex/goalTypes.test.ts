/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'
import { SYSTEM_GOAL_TYPES } from './goalTypes'

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

describe('goalTypes.list', () => {
  test('returns system types and no custom types for a fresh user', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const result = await asUser.query(api.goalTypes.list, {})
    expect(result.system).toEqual(SYSTEM_GOAL_TYPES)
    expect(result.custom).toEqual([])
  })

  test('requires authentication', async () => {
    const t = setup()
    await expect(t.query(api.goalTypes.list, {})).rejects.toThrowError(/Not authenticated/)
  })
})

describe('goalTypes.create', () => {
  test('creates a custom type visible in list', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await asUser.mutation(api.goalTypes.create, {
      name: 'Side Projects',
      color: 'violet',
    })
    const result = await asUser.query(api.goalTypes.list, {})
    expect(result.custom).toMatchObject([
      { _id: id, name: 'Side Projects', color: 'violet', icon: null },
    ])
  })

  test('rejects empty names', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(
      asUser.mutation(api.goalTypes.create, { name: '   ' }),
    ).rejects.toThrowError(/Name is required/)
  })

  test('rejects duplicate custom names case-insensitively', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await asUser.mutation(api.goalTypes.create, { name: 'Side Projects' })
    await expect(
      asUser.mutation(api.goalTypes.create, { name: 'side projects' }),
    ).rejects.toThrowError(/already exists/)
  })

  test('rejects names that clash with system types', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(
      asUser.mutation(api.goalTypes.create, { name: 'Fitness' }),
    ).rejects.toThrowError(/built-in type/)
  })

  test('same name is allowed across different users', async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    await asAlice.mutation(api.goalTypes.create, { name: 'Side Projects' })
    await expect(
      asBob.mutation(api.goalTypes.create, { name: 'Side Projects' }),
    ).resolves.toBeDefined()
  })
})

describe('goalTypes.update', () => {
  test('renames a custom type', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await asUser.mutation(api.goalTypes.create, { name: 'Side Projects' })
    const result = await asUser.mutation(api.goalTypes.update, { id, name: 'Hobbies' })
    expect(result).toEqual({ changed: true })
    const list = await asUser.query(api.goalTypes.list, {})
    expect(list.custom[0]?.name).toBe('Hobbies')
  })

  test("cannot edit another user's type", async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    const id = await asAlice.mutation(api.goalTypes.create, { name: 'Side Projects' })
    await expect(
      asBob.mutation(api.goalTypes.update, { id, name: 'Stolen' }),
    ).rejects.toThrowError(/Forbidden/)
  })
})

describe('goalTypes.remove', () => {
  test('removes an unused custom type', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await asUser.mutation(api.goalTypes.create, { name: 'Side Projects' })
    await asUser.mutation(api.goalTypes.remove, { id })
    const list = await asUser.query(api.goalTypes.list, {})
    expect(list.custom).toEqual([])
  })

  test('blocks removal while a goal references the type', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await asUser.mutation(api.goalTypes.create, { name: 'Side Projects' })
    await asUser.mutation(api.goals.create, {
      title: 'Ship the pixel village',
      deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
      customTypeId: id,
    })
    await expect(asUser.mutation(api.goalTypes.remove, { id })).rejects.toThrowError(
      /used by a goal/,
    )
  })
})
