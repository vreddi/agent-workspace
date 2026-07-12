/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import type { UserJSON } from '@clerk/backend'
import { internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

function setup() {
  return convexTest(schema, modules)
}

// Build the slice of Clerk's UserJSON payload that upsertFromClerk actually
// reads. Cast through unknown so tests don't have to spell out the dozens of
// unrelated fields Clerk sends.
function clerkUser(overrides: {
  id: string
  email?: string
  firstName?: string | null
  lastName?: string | null
  imageUrl?: string
}): UserJSON {
  return {
    id: overrides.id,
    email_addresses: [{ email_address: overrides.email ?? `${overrides.id}@example.com` }],
    first_name: overrides.firstName ?? null,
    last_name: overrides.lastName ?? null,
    image_url: overrides.imageUrl,
  } as unknown as UserJSON
}

async function readUser(t: ReturnType<typeof setup>, externalId: string) {
  return t.run(async (ctx) => {
    return ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
      .unique()
  })
}

async function countUsers(t: ReturnType<typeof setup>) {
  return t.run(async (ctx) => (await ctx.db.query('users').collect()).length)
}

describe('users.upsertFromClerk', () => {
  test('creates a user from a Clerk payload', async () => {
    const t = setup()
    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser({
        id: 'user_1',
        email: 'ada@example.com',
        firstName: 'Ada',
        lastName: 'Lovelace',
        imageUrl: 'https://img.example.com/ada.png',
      }),
    })

    const user = await readUser(t, 'user_1')
    expect(user).toMatchObject({
      externalId: 'user_1',
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      imageUrl: 'https://img.example.com/ada.png',
    })
    expect(await countUsers(t)).toBe(1)
  })

  test('trims a name from partial first/last and defaults a missing image', async () => {
    const t = setup()
    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser({ id: 'user_2', firstName: 'Grace', lastName: null }),
    })

    const user = await readUser(t, 'user_2')
    expect(user?.name).toBe('Grace')
    expect(user?.imageUrl).toBeUndefined()
  })

  test('updates the existing row instead of inserting a duplicate', async () => {
    const t = setup()
    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser({ id: 'user_3', firstName: 'Alan', lastName: 'Turing' }),
    })
    const created = await readUser(t, 'user_3')

    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser({
        id: 'user_3',
        email: 'alan.turing@example.com',
        firstName: 'Alan M.',
        lastName: 'Turing',
      }),
    })

    const updated = await readUser(t, 'user_3')
    expect(await countUsers(t)).toBe(1)
    expect(updated?._id).toBe(created?._id)
    expect(updated).toMatchObject({
      name: 'Alan M. Turing',
      email: 'alan.turing@example.com',
    })
  })
})

describe('users.deleteFromClerk', () => {
  test('deletes the matching user', async () => {
    const t = setup()
    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser({ id: 'user_4' }),
    })
    expect(await readUser(t, 'user_4')).not.toBeNull()

    await t.mutation(internal.users.deleteFromClerk, { clerkUserId: 'user_4' })

    expect(await readUser(t, 'user_4')).toBeNull()
    expect(await countUsers(t)).toBe(0)
  })

  test('is a no-op for a non-existent Clerk user id', async () => {
    const t = setup()
    await t.mutation(internal.users.upsertFromClerk, {
      data: clerkUser({ id: 'keep_me' }),
    })

    await expect(
      t.mutation(internal.users.deleteFromClerk, { clerkUserId: 'ghost_user' }),
    ).resolves.toBeNull()

    // The unrelated user is untouched.
    expect(await readUser(t, 'keep_me')).not.toBeNull()
    expect(await countUsers(t)).toBe(1)
  })
})
