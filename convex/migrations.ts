import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import { internal } from './_generated/api'

// One-off backfill for the taskAssignments join table: turns the deprecated
// tasks.assigneeUserId / assigneeUserIds fields into assignment rows and
// clears them. Idempotent — safe to re-run. Kick it off once after deploy:
//
//   npx convex run migrations:backfillTaskAssignments
//
// Batched and self-scheduling so it stays inside transaction limits on any
// table size. Once it finishes (and dual-read has nothing left to fall back
// to), the deprecated fields and tasks.by_assignee_status can be dropped in
// a follow-up narrow deploy.
export const backfillTaskAssignments = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args) => {
    const { page, isDone, continueCursor } = await ctx.db
      .query('tasks')
      .paginate({ numItems: 50, cursor: args.cursor ?? null })

    for (const task of page) {
      const legacyIds =
        task.assigneeUserIds && task.assigneeUserIds.length > 0
          ? task.assigneeUserIds
          : task.assigneeUserId
            ? [task.assigneeUserId]
            : []
      for (const userId of new Set(legacyIds)) {
        const existing = await ctx.db
          .query('taskAssignments')
          .withIndex('by_task_and_user', (q) => q.eq('taskId', task._id).eq('userId', userId))
          .unique()
        if (existing) continue
        if ((await ctx.db.get(userId)) === null) continue
        await ctx.db.insert('taskAssignments', {
          taskId: task._id,
          userId,
          assignedById: task.creatorId,
          status: task.status,
        })
      }
      if (task.assigneeUserId !== undefined || task.assigneeUserIds !== undefined) {
        await ctx.db.patch(task._id, {
          assigneeUserId: undefined,
          assigneeUserIds: undefined,
        })
      }
    }

    if (!isDone) {
      await ctx.scheduler.runAfter(0, internal.migrations.backfillTaskAssignments, {
        cursor: continueCursor,
      })
    }
    return { migrated: page.length, isDone }
  },
})
