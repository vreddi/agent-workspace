import { ConvexError, v } from 'convex/values'
import { mutation, query, QueryCtx } from './_generated/server'
import { getCurrentUser } from './users'

async function requireUserId(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throw new ConvexError('Not authenticated')
  }
  return user._id
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    return await ctx.db
      .query('todos')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const title = args.title.trim()
    if (!title) {
      throw new ConvexError('Title is required')
    }
    return await ctx.db.insert('todos', {
      userId,
      title,
      completed: false,
    })
  },
})

export const toggle = mutation({
  args: { id: v.id('todos') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const todo = await ctx.db.get(args.id)
    if (!todo || todo.userId !== userId) {
      throw new ConvexError('Todo not found')
    }
    await ctx.db.patch(args.id, { completed: !todo.completed })
  },
})

export const remove = mutation({
  args: { id: v.id('todos') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const todo = await ctx.db.get(args.id)
    if (!todo || todo.userId !== userId) {
      throw new ConvexError('Todo not found')
    }
    await ctx.db.delete(args.id)
  },
})
