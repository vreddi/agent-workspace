/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'
import { REMINDER_COOLDOWN_MS } from './goalReminders'

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

function createGoal(asUser: UserClient, overrides: Record<string, unknown> = {}) {
  return asUser.mutation(api.goals.create, {
    title: 'Run a marathon',
    deadline: Date.now() + 3 * DAY_MS,
    ...overrides,
  })
}

describe('goalReminders.remindDueGoals', () => {
  test('reminds a goal whose deadline is inside its window', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser) // 3 days out, default window 7
    const { reminded } = await t.mutation(internal.goalReminders.remindDueGoals, {})
    expect(reminded).toBe(1)
    const unread = await asUser.query(api.goalReminders.listUnread, {})
    expect(unread).toMatchObject([
      {
        goalId,
        kind: 'approaching',
        goalTitle: 'Run a marathon',
        daysRemaining: 3,
        readAt: null,
      },
    ])
  })

  test('skips goals still outside their reminder window', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await createGoal(asUser, { deadline: Date.now() + 30 * DAY_MS }) // window 7
    const { reminded } = await t.mutation(internal.goalReminders.remindDueGoals, {})
    expect(reminded).toBe(0)
  })

  test('respects a per-goal window wider than the default', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await createGoal(asUser, {
      deadline: Date.now() + 30 * DAY_MS,
      reminderDaysBefore: 45,
    })
    const { reminded } = await t.mutation(internal.goalReminders.remindDueGoals, {})
    expect(reminded).toBe(1)
  })

  test('marks overdue goals and keeps reminding them', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    await t.run(async (ctx) => {
      await ctx.db.patch(goalId, { deadline: Date.now() - 2 * DAY_MS })
    })
    await t.mutation(internal.goalReminders.remindDueGoals, {})
    const unread = await asUser.query(api.goalReminders.listUnread, {})
    expect(unread).toHaveLength(1)
    expect(unread[0]).toMatchObject({ kind: 'overdue' })
    expect(unread[0]!.daysRemaining).toBeLessThanOrEqual(0)
  })

  test('does not re-remind inside the cooldown, but does after it', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)

    const first = await t.mutation(internal.goalReminders.remindDueGoals, {})
    expect(first.reminded).toBe(1)
    const second = await t.mutation(internal.goalReminders.remindDueGoals, {})
    expect(second.reminded).toBe(0)

    // Simulate the cooldown elapsing.
    await t.run(async (ctx) => {
      await ctx.db.patch(goalId, {
        lastRemindedAt: Date.now() - REMINDER_COOLDOWN_MS - 1,
      })
    })
    const third = await t.mutation(internal.goalReminders.remindDueGoals, {})
    expect(third.reminded).toBe(1)
    const unread = await asUser.query(api.goalReminders.listUnread, {})
    expect(unread).toHaveLength(2)
  })

  test('ignores achieved and archived goals', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const achieved = await createGoal(asUser, { title: 'Achieved' })
    const archived = await createGoal(asUser, { title: 'Archived' })
    await asUser.mutation(api.goals.setStatus, { id: achieved, status: 'achieved' })
    await asUser.mutation(api.goals.setStatus, { id: archived, status: 'archived' })
    const { reminded } = await t.mutation(internal.goalReminders.remindDueGoals, {})
    expect(reminded).toBe(0)
  })
})

describe('reading reminders', () => {
  test('markRead removes a reminder from the unread list', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    await createGoal(asUser)
    await t.mutation(internal.goalReminders.remindDueGoals, {})
    const [reminder] = await asUser.query(api.goalReminders.listUnread, {})
    await asUser.mutation(api.goalReminders.markRead, { id: reminder!._id })
    expect(await asUser.query(api.goalReminders.listUnread, {})).toEqual([])
  })

  test("markRead rejects another user's reminder", async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    await createGoal(asAlice)
    await t.mutation(internal.goalReminders.remindDueGoals, {})
    const [reminder] = await asAlice.query(api.goalReminders.listUnread, {})
    await expect(
      asBob.mutation(api.goalReminders.markRead, { id: reminder!._id }),
    ).rejects.toThrowError(/Reminder not found/)
  })

  test('markAllRead clears the unread list for the caller only', async () => {
    const t = setup()
    const asAlice = await signUp(t, 'alice')
    const asBob = await signUp(t, 'bob')
    await createGoal(asAlice, { title: 'Alice goal' })
    await createGoal(asBob, { title: 'Bob goal' })
    await t.mutation(internal.goalReminders.remindDueGoals, {})

    const { marked } = await asAlice.mutation(api.goalReminders.markAllRead, {})
    expect(marked).toBe(1)
    expect(await asAlice.query(api.goalReminders.listUnread, {})).toEqual([])
    expect(await asBob.query(api.goalReminders.listUnread, {})).toHaveLength(1)
  })
})
