import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { requireUserId } from './lib/auth'

const spriteValidator = v.union(
  v.object({ kind: v.literal('stub'), stubId: v.string() }),
  v.object({ kind: v.literal('custom'), sheetUrl: v.string() }),
)

function assertCanEditAgent(
  agent: Doc<'agents'> | null,
  userId: Id<'users'>,
): asserts agent is Doc<'agents'> {
  if (!agent) {
    throw new ConvexError('Agent not found')
  }
  if (agent.ownerId !== userId) {
    throw new ConvexError('Forbidden')
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    return await ctx.db
      .query('agents')
      .withIndex('by_owner_archived', (q) =>
        q.eq('ownerId', userId).eq('archivedAt', null),
      )
      .take(100)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    personality: v.optional(v.string()),
    model: v.string(),
    sprite: spriteValidator,
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const name = args.name.trim()
    if (!name) throw new ConvexError('Name is required')
    const model = args.model.trim()
    if (!model) throw new ConvexError('Model is required')
    const trimmedPersonality = args.personality?.trim() ?? ''
    const personality = trimmedPersonality === '' ? null : trimmedPersonality
    return await ctx.db.insert('agents', {
      ownerId: userId,
      name,
      personality,
      model,
      sprite: args.sprite,
      archivedAt: null,
      updatedAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('agents'),
    name: v.optional(v.string()),
    personality: v.optional(v.union(v.string(), v.null())),
    model: v.optional(v.string()),
    sprite: v.optional(spriteValidator),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const agent = await ctx.db.get(args.id)
    assertCanEditAgent(agent, userId)
    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) {
      const trimmed = args.name.trim()
      if (!trimmed) throw new ConvexError('Name is required')
      patch.name = trimmed
    }
    if (args.personality !== undefined) {
      if (args.personality === null) {
        patch.personality = null
      } else {
        const trimmed = args.personality.trim()
        patch.personality = trimmed === '' ? null : trimmed
      }
    }
    if (args.model !== undefined) {
      const trimmed = args.model.trim()
      if (!trimmed) throw new ConvexError('Model is required')
      patch.model = trimmed
    }
    if (args.sprite !== undefined) {
      patch.sprite = args.sprite
    }
    if (Object.keys(patch).length === 0) return { changed: false }
    patch.updatedAt = Date.now()
    await ctx.db.patch(args.id, patch)
    return { changed: true }
  },
})

export const remove = mutation({
  args: { id: v.id('agents') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const agent = await ctx.db.get(args.id)
    assertCanEditAgent(agent, userId)
    await ctx.db.delete(args.id)
  },
})
