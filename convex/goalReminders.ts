import { ConvexError, v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
import { DAY_MS, MAX_REMINDER_DAYS_BEFORE } from './goals'
import { requireUserId } from './lib/auth'

// A goal is re-reminded at most once per cooldown window. Slightly under a
// day so an hourly cron lands roughly daily rather than drifting to 25h.
export const REMINDER_COOLDOWN_MS = 20 * 60 * 60 * 1000

// Called hourly by the cron in crons.ts. Scans active goals whose deadline is
// near enough that reminders could apply, and files a reminder for each goal
// inside its reminder window — repeatedly (once per cooldown) until the goal
// is achieved, archived, or its deadline moves: the "constant" in constant
// reminders.
export const remindDueGoals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    const horizon = now + MAX_REMINDER_DAYS_BEFORE * DAY_MS
    const candidates = await ctx.db
      .query('goals')
      .withIndex('by_status_deadline', (q) =>
        q.eq('status', 'active').lte('deadline', horizon),
      )
      .take(500)
    let reminded = 0
    for (const goal of candidates) {
      const daysRemaining = Math.ceil((goal.deadline - now) / DAY_MS)
      if (daysRemaining > goal.reminderDaysBefore) continue
      if (goal.lastRemindedAt !== null && now - goal.lastRemindedAt < REMINDER_COOLDOWN_MS) {
        continue
      }
      await ctx.db.insert('goalReminders', {
        goalId: goal._id,
        userId: goal.creatorId,
        kind: goal.deadline < now ? 'overdue' : 'approaching',
        goalTitle: goal.title,
        deadline: goal.deadline,
        daysRemaining,
        readAt: null,
      })
      await ctx.db.patch(goal._id, { lastRemindedAt: now })
      reminded += 1
    }
    return { reminded }
  },
})

export const listUnread = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    return await ctx.db
      .query('goalReminders')
      .withIndex('by_user_read', (q) => q.eq('userId', userId).eq('readAt', null))
      .order('desc')
      .take(50)
  },
})

export const markRead = mutation({
  args: { id: v.id('goalReminders') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const reminder = await ctx.db.get(args.id)
    if (!reminder || reminder.userId !== userId) {
      throw new ConvexError('Reminder not found')
    }
    if (reminder.readAt !== null) return { changed: false }
    await ctx.db.patch(args.id, { readAt: Date.now() })
    return { changed: true }
  },
})

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const now = Date.now()
    let marked = 0
    // Bounded per call; the unread list itself is capped well below this.
    const unread = await ctx.db
      .query('goalReminders')
      .withIndex('by_user_read', (q) => q.eq('userId', userId).eq('readAt', null))
      .take(200)
    for (const reminder of unread) {
      await ctx.db.patch(reminder._id, { readAt: now })
      marked += 1
    }
    return { marked }
  },
})
