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

type UserClient = Awaited<ReturnType<typeof signUp>>

const stubSprite = { kind: 'stub', stubId: 'red' } as const

function createAgent(
  asUser: UserClient,
  overrides: Record<string, unknown> = {},
) {
  return asUser.mutation(api.agents.create, {
    name: 'Pip',
    model: 'sonnet',
    sprite: stubSprite,
    ...overrides,
  })
}

describe('agents.create', () => {
  test('creates an agent with trimmed fields and defaults', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await createAgent(asUser, {
      name: '  Pip  ',
      model: '  sonnet  ',
      personality: '  curious  ',
    })
    const agents = await asUser.query(api.agents.list, {})
    expect(agents).toHaveLength(1)
    expect(agents[0]).toMatchObject({
      _id: id,
      name: 'Pip',
      model: 'sonnet',
      personality: 'curious',
      sprite: stubSprite,
      archivedAt: null,
    })
  })

  test('empty personality becomes null', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await createAgent(asUser, { personality: '   ' })
    const agents = await asUser.query(api.agents.list, {})
    expect(agents[0].personality).toBeNull()
  })

  test('rejects blank name and blank model', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await expect(createAgent(asUser, { name: '  ' })).rejects.toThrowError(
      /Name is required/,
    )
    await expect(createAgent(asUser, { model: '  ' })).rejects.toThrowError(
      /Model is required/,
    )
  })

  test('accepts a custom sprite sheet', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const sprite = {
      kind: 'custom',
      sheetUrl: 'https://example.com/sheet.png',
    } as const
    await createAgent(asUser, { sprite })
    const agents = await asUser.query(api.agents.list, {})
    expect(agents[0].sprite).toEqual(sprite)
  })
})

describe('agents.list', () => {
  test("returns only the caller's non-archived agents", async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    const aliceAgent = await createAgent(asAlice, { name: 'AliceBot' })
    await createAgent(asBob, { name: 'BobBot' })
    const archived = await createAgent(asAlice, { name: 'Ghost' })
    await t.run(async (ctx) => {
      await ctx.db.patch(archived, { archivedAt: Date.now() })
    })

    const aliceAgents = await asAlice.query(api.agents.list, {})
    expect(aliceAgents).toHaveLength(1)
    expect(aliceAgents[0]._id).toBe(aliceAgent)

    const bobAgents = await asBob.query(api.agents.list, {})
    expect(bobAgents.map((a) => a.name)).toEqual(['BobBot'])
  })
})

describe('agents.update', () => {
  test('patches provided fields and reports change', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await createAgent(asUser)
    const before = await asUser.query(api.agents.list, {})
    const result = await asUser.mutation(api.agents.update, {
      id,
      name: '  Renamed  ',
      model: '  opus  ',
      personality: null,
    })
    expect(result).toEqual({ changed: true })
    const [agent] = await asUser.query(api.agents.list, {})
    expect(agent).toMatchObject({
      name: 'Renamed',
      model: 'opus',
      personality: null,
    })
    expect(agent.updatedAt).toBeGreaterThanOrEqual(before[0].updatedAt)
  })

  test('no fields is a no-op', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await createAgent(asUser)
    const result = await asUser.mutation(api.agents.update, { id })
    expect(result).toEqual({ changed: false })
  })

  test('rejects blank name and blank model on update', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await createAgent(asUser)
    await expect(
      asUser.mutation(api.agents.update, { id, name: '  ' }),
    ).rejects.toThrowError(/Name is required/)
    await expect(
      asUser.mutation(api.agents.update, { id, model: '  ' }),
    ).rejects.toThrowError(/Model is required/)
  })
})

describe('agents.remove', () => {
  test("deletes the caller's agent", async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const id = await createAgent(asUser)
    await asUser.mutation(api.agents.remove, { id })
    expect(await asUser.query(api.agents.list, {})).toHaveLength(0)
  })
})

describe('agents auth enforcement', () => {
  test('unauthenticated callers are rejected', async () => {
    const t = setup()
    await expect(t.query(api.agents.list, {})).rejects.toThrowError(
      /Not authenticated/,
    )
    await expect(
      t.mutation(api.agents.create, {
        name: 'Pip',
        model: 'sonnet',
        sprite: stubSprite,
      }),
    ).rejects.toThrowError(/Not authenticated/)
  })
})

describe('agents ownership (assertCanEditAgent)', () => {
  test("user B cannot update or remove user A's agent", async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    const id = await createAgent(asAlice)
    await expect(
      asBob.mutation(api.agents.update, { id, name: 'Hijacked' }),
    ).rejects.toThrowError(/Forbidden/)
    await expect(
      asBob.mutation(api.agents.remove, { id }),
    ).rejects.toThrowError(/Forbidden/)
    // Alice's agent is untouched.
    const [agent] = await asAlice.query(api.agents.list, {})
    expect(agent.name).toBe('Pip')
  })

  test('editing a missing agent reports not found', async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    const id = await createAgent(asAlice)
    await asAlice.mutation(api.agents.remove, { id })
    await expect(
      asBob.mutation(api.agents.update, { id, name: 'Ghost' }),
    ).rejects.toThrowError(/Agent not found/)
  })
})
