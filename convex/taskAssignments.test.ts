/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api, internal } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

function setup() {
  return convexTest(schema, modules)
}

async function signUp(
  t: ReturnType<typeof setup>,
  externalId: string,
  name?: string,
) {
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert('users', {
      externalId,
      email: `${externalId}@example.com`,
      name: name ?? externalId,
    })
  })
  return { as: t.withIdentity({ subject: externalId }), userId }
}

describe('task creation and assignment defaults', () => {
  test('a new task is assigned to its creator via an assignment row', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice')
    const taskId = await alice.as.mutation(api.tasks.create, {
      title: 'Solo task',
    })

    const rows = await t.run((ctx) =>
      ctx.db
        .query('taskAssignments')
        .withIndex('by_task', (q) => q.eq('taskId', taskId))
        .collect(),
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      userId: alice.userId,
      assignedById: alice.userId,
      status: 'open',
    })

    const task = await t.run((ctx) => ctx.db.get(taskId))
    expect(task?.assigneeUserId).toBeUndefined()
    expect(task?.assigneeUserIds).toBeUndefined()

    const list = await alice.as.query(api.tasks.list, {})
    expect(list.map((item) => item._id)).toContain(taskId)
    expect(list[0]?.assignees.map((a) => a.userId)).toEqual([alice.userId])
  })

  test('creation always self-assigns; handing off happens afterwards', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice')
    const bob = await signUp(t, 'bob')
    const taskId = await alice.as.mutation(api.tasks.create, {
      title: 'Delegated after capture',
    })

    // Fresh task belongs to its creator only.
    const freshRows = await t.run((ctx) =>
      ctx.db
        .query('taskAssignments')
        .withIndex('by_task', (q) => q.eq('taskId', taskId))
        .collect(),
    )
    expect(freshRows.map((row) => row.userId)).toEqual([alice.userId])

    await alice.as.mutation(api.taskAssignments.setAssignees, {
      taskId,
      assigneeIds: [bob.userId],
    })

    const bobList = await bob.as.query(api.tasks.list, {})
    expect(bobList.map((item) => item._id)).toContain(taskId)

    // The creator still sees the task in their list even without being
    // assigned, so delegated work doesn't disappear.
    const aliceList = await alice.as.query(api.tasks.list, {})
    expect(aliceList.map((item) => item._id)).toContain(taskId)
  })
})

describe('taskAssignments.setAssignees', () => {
  test('sharing a task makes it visible and editable for the new assignee', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice', 'Alice A')
    const bob = await signUp(t, 'bob', 'Bob B')
    const taskId = await alice.as.mutation(api.tasks.create, {
      title: 'Shared',
    })

    // Before sharing, Bob can't even read the task.
    await expect(
      bob.as.query(api.tasks.get, { id: taskId }),
    ).rejects.toThrowError(/Forbidden/)

    await alice.as.mutation(api.taskAssignments.setAssignees, {
      taskId,
      assigneeIds: [alice.userId, bob.userId],
    })

    const detail = await bob.as.query(api.tasks.get, { id: taskId })
    expect(detail.assignees.map((a) => a.userId).sort()).toEqual(
      [alice.userId, bob.userId].sort(),
    )
    expect(detail.viewerIsCreator).toBe(false)

    // Bob can now work on it, and the status change lands in Alice's
    // filtered list (denormalized status stays in sync).
    await bob.as.mutation(api.tasks.update, { id: taskId, status: 'done' })
    const aliceDone = await alice.as.query(api.tasks.list, { status: 'done' })
    expect(aliceDone.map((item) => item._id)).toContain(taskId)
    const bobDone = await bob.as.query(api.tasks.list, { status: 'done' })
    expect(bobDone.map((item) => item._id)).toContain(taskId)
  })

  test('reassigning entirely removes the task from the old assignee list but not the creator view', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice')
    const bob = await signUp(t, 'bob')
    const taskId = await alice.as.mutation(api.tasks.create, {
      title: 'Handoff',
    })

    await alice.as.mutation(api.taskAssignments.setAssignees, {
      taskId,
      assigneeIds: [bob.userId],
    })

    const rows = await t.run((ctx) =>
      ctx.db
        .query('taskAssignments')
        .withIndex('by_task', (q) => q.eq('taskId', taskId))
        .collect(),
    )
    expect(rows.map((row) => row.userId)).toEqual([bob.userId])

    // Alice keeps creator visibility; Bob is the only assignee.
    const aliceList = await alice.as.query(api.tasks.list, {})
    expect(aliceList.map((item) => item._id)).toContain(taskId)
    const item = aliceList.find((entry) => entry._id === taskId)
    expect(item?.assignees.map((a) => a.userId)).toEqual([bob.userId])
  })

  test('records an assignees change in the task history', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice', 'Alice A')
    const bob = await signUp(t, 'bob', 'Bob B')
    const taskId = await alice.as.mutation(api.tasks.create, {
      title: 'Audited',
    })
    await alice.as.mutation(api.taskAssignments.setAssignees, {
      taskId,
      assigneeIds: [alice.userId, bob.userId],
    })
    const history = await alice.as.query(api.tasks.history, { taskId })
    const change = history
      .flatMap((event) => event.changes)
      .find((c) => c.field === 'assignees' && c.before !== null)
    expect(change).toBeDefined()
    expect(JSON.parse(change!.before!)).toEqual(['Alice A'])
    expect(JSON.parse(change!.after!)).toEqual(['Alice A', 'Bob B'])
  })

  test('outsiders cannot reassign; assignees can remove themselves', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice')
    const bob = await signUp(t, 'bob')
    const eve = await signUp(t, 'eve')
    const taskId = await alice.as.mutation(api.tasks.create, {
      title: 'Guarded',
    })

    await expect(
      eve.as.mutation(api.taskAssignments.setAssignees, {
        taskId,
        assigneeIds: [eve.userId],
      }),
    ).rejects.toThrowError(/Forbidden/)

    await alice.as.mutation(api.taskAssignments.setAssignees, {
      taskId,
      assigneeIds: [alice.userId, bob.userId],
    })
    await bob.as.mutation(api.taskAssignments.setAssignees, {
      taskId,
      assigneeIds: [alice.userId],
    })
    const bobList = await bob.as.query(api.tasks.list, {})
    expect(bobList.map((item) => item._id)).not.toContain(taskId)
  })

  test('rejects an empty assignee set and unknown accounts', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice')
    const taskId = await alice.as.mutation(api.tasks.create, {
      title: 'Keep one',
    })
    await expect(
      alice.as.mutation(api.taskAssignments.setAssignees, {
        taskId,
        assigneeIds: [],
      }),
    ).rejects.toThrowError(/at least one assignee/)

    const ghost = await t.run(async (ctx) => {
      const id = await ctx.db.insert('users', {
        externalId: 'ghost',
        email: 'ghost@example.com',
        name: 'Ghost',
      })
      await ctx.db.delete(id)
      return id
    })
    await expect(
      alice.as.mutation(api.taskAssignments.setAssignees, {
        taskId,
        assigneeIds: [ghost],
      }),
    ).rejects.toThrowError(/Assignee not found/)
  })
})

describe('tasks.remove with shared tasks', () => {
  test('only the creator can delete; assignment rows are cleaned up', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice')
    const bob = await signUp(t, 'bob')
    const taskId = await alice.as.mutation(api.tasks.create, {
      title: 'Doomed',
    })
    await alice.as.mutation(api.taskAssignments.setAssignees, {
      taskId,
      assigneeIds: [alice.userId, bob.userId],
    })

    await expect(
      bob.as.mutation(api.tasks.remove, { id: taskId }),
    ).rejects.toThrowError(/creator/)
    await alice.as.mutation(api.tasks.remove, { id: taskId })
    const rows = await t.run((ctx) =>
      ctx.db
        .query('taskAssignments')
        .withIndex('by_task', (q) => q.eq('taskId', taskId))
        .collect(),
    )
    expect(rows).toHaveLength(0)
  })
})

describe('users.search', () => {
  test('finds accounts by name and by email prefix, flagging yourself', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice', 'Alice Anderson')
    await signUp(t, 'bob', 'Bob Brown')
    await signUp(t, 'carol', 'Carol Chen')

    const byName = await alice.as.query(api.users.search, { query: 'Bob' })
    expect(byName.map((u) => u.name)).toContain('Bob Brown')

    const byEmail = await alice.as.query(api.users.search, { query: 'carol@' })
    expect(byEmail.map((u) => u.email)).toContain('carol@example.com')

    const self = await alice.as.query(api.users.search, { query: 'Alice' })
    expect(self.find((u) => u.userId === alice.userId)?.isYou).toBe(true)

    const empty = await alice.as.query(api.users.search, { query: '   ' })
    expect(empty).toEqual([])
  })
})

describe('migrations.backfillTaskAssignments', () => {
  test('converts legacy assignee fields into assignment rows and clears them', async () => {
    const t = setup()
    const alice = await signUp(t, 'alice')
    const bob = await signUp(t, 'bob')

    // A row shaped the way tasks looked before the join table existed.
    const legacyTaskId = await t.run(async (ctx) => {
      return await ctx.db.insert('tasks', {
        title: 'Legacy task',
        description: null,
        creatorId: alice.userId,
        assigneeUserId: alice.userId,
        assigneeUserIds: [alice.userId, bob.userId],
        status: 'in_progress',
        completedAt: null,
        softDeadline: null,
        hardDeadline: null,
        estimateMinutes: null,
        updatedAt: Date.now(),
      })
    })

    // Dual-read keeps the legacy task visible for its primary assignee even
    // before the backfill. Secondary assignees (array only, never indexable)
    // gain list visibility only once the backfill creates their rows — that
    // gap is exactly what this migration exists to close.
    const beforeAlice = await alice.as.query(api.tasks.list, {})
    expect(beforeAlice.map((item) => item._id)).toContain(legacyTaskId)

    await t.mutation(internal.migrations.backfillTaskAssignments, {})

    const rows = await t.run((ctx) =>
      ctx.db
        .query('taskAssignments')
        .withIndex('by_task', (q) => q.eq('taskId', legacyTaskId))
        .collect(),
    )
    expect(rows.map((row) => row.userId).sort()).toEqual(
      [alice.userId, bob.userId].sort(),
    )
    expect(rows.every((row) => row.status === 'in_progress')).toBe(true)

    const task = await t.run((ctx) => ctx.db.get(legacyTaskId))
    expect(task?.assigneeUserId).toBeUndefined()
    expect(task?.assigneeUserIds).toBeUndefined()

    // Re-running is a no-op.
    await t.mutation(internal.migrations.backfillTaskAssignments, {})
    const rowsAfter = await t.run((ctx) =>
      ctx.db
        .query('taskAssignments')
        .withIndex('by_task', (q) => q.eq('taskId', legacyTaskId))
        .collect(),
    )
    expect(rowsAfter).toHaveLength(rows.length)

    const after = await bob.as.query(api.tasks.list, { status: 'in_progress' })
    expect(after.map((item) => item._id)).toContain(legacyTaskId)
  })
})
