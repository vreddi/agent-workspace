import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from './_generated/server'
import { Validator, v } from 'convex/values'
import { UserJSON } from '@clerk/backend'
import { Id } from './_generated/dataModel'
import { theme } from './schema'

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx)
  },
})

export type UserSearchResult = {
  userId: Id<'users'>
  name: string
  email: string
  imageUrl: string | null
  isYou: boolean
}

const SEARCH_LIMIT = 8

// Open directory search for the assignee picker: any signed-in user can find
// any account by name (full-text) or email (prefix). Deliberately unscoped —
// there are no teams yet, sharing is between any two accounts.
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args): Promise<UserSearchResult[]> => {
    const me = await getCurrentUser(ctx)
    if (!me) return []
    const term = args.query.trim()
    if (term === '') return []

    const byName = await ctx.db
      .query('users')
      .withSearchIndex('search_name', (q) => q.search('name', term))
      .take(SEARCH_LIMIT)
    const emailPrefix = term.toLowerCase()
    const byEmail = await ctx.db
      .query('users')
      .withIndex('by_email', (q) =>
        q.gte('email', emailPrefix).lt('email', emailPrefix + '\uffff'),
      )
      .take(SEARCH_LIMIT)

    const seen = new Set<Id<'users'>>()
    const results: UserSearchResult[] = []
    for (const user of [...byName, ...byEmail]) {
      if (seen.has(user._id)) continue
      seen.add(user._id)
      results.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl ?? null,
        isYou: user._id === me._id,
      })
      if (results.length >= SEARCH_LIMIT) break
    }
    return results
  },
})

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const userAttributes = {
      externalId: data.id,
      email: data.email_addresses[0]?.email_address || '',
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      imageUrl: data.image_url || undefined,
    }

    const user = await userByExternalId(ctx, data.id)
    if (user === null) {
      await ctx.db.insert('users', userAttributes)
    } else {
      await ctx.db.patch(user._id, userAttributes)
    }
  },
})

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId)

    if (user !== null) {
      await ctx.db.delete(user._id)
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      )
    }
  },
})

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) {
    return null
  }
  return await userByExternalId(ctx, identity.subject)
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_externalId', (q) => q.eq('externalId', externalId))
    .unique()
}

export const updateTheme = mutation({
  args: { theme: v.union(theme, v.null()) },
  async handler(ctx, args) {
    const user = await getCurrentUser(ctx)
    if (!user) {
      throw new Error('Not authenticated')
    }
    await ctx.db.patch(user._id, { theme: args.theme })
    return { theme: args.theme }
  },
})
