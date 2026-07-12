import { ConvexError, v } from 'convex/values'
import { mutation, query, QueryCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { requireUserId } from './lib/auth'

export type SystemGoalType = {
  slug: string
  name: string
  description: string
  color: string
  // Stub glyph name (rendered as a fallback emoji tile on the client).
  icon: string
  // Optional path to authored icon art served from apps/web/public. When
  // present the client shows this image instead of the stub glyph.
  image?: string
}

// Built-in categories every user gets. Stored as code, not rows, so there is
// nothing to seed or migrate; goals reference these by slug.
export const SYSTEM_GOAL_TYPES: readonly SystemGoalType[] = [
  {
    slug: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Sleep, nutrition, mental health, and feeling your best.',
    color: 'emerald',
    icon: 'heart',
    image: '/goal-types/health-wellness.png',
  },
  {
    slug: 'fitness',
    name: 'Fitness',
    description: 'Training, movement, and physical performance.',
    color: 'orange',
    icon: 'dumbbell',
  },
  {
    slug: 'business',
    name: 'Business',
    description: 'Building, running, or growing a venture.',
    color: 'indigo',
    icon: 'briefcase',
  },
  {
    slug: 'career',
    name: 'Career',
    description: 'Roles, skills, and professional advancement.',
    color: 'sky',
    icon: 'trending-up',
  },
  {
    slug: 'relationships',
    name: 'Relationships',
    description: 'Family, friends, and the people who matter.',
    color: 'rose',
    icon: 'users',
    image: '/goal-types/relationships.png',
  },
  {
    slug: 'finance',
    name: 'Finance',
    description: 'Saving, investing, and money milestones.',
    color: 'amber',
    icon: 'piggy-bank',
    image: '/goal-types/finance.png',
  },
  {
    slug: 'learning',
    name: 'Learning',
    description: 'Courses, books, and new skills to master.',
    color: 'violet',
    icon: 'book-open',
    image: '/goal-types/learning.png',
  },
  {
    slug: 'personal-growth',
    name: 'Personal Growth',
    description: 'Habits, mindset, and becoming who you want to be.',
    color: 'slate',
    icon: 'sprout',
  },
  {
    slug: 'travel',
    name: 'Travel',
    description: 'Trips, destinations, and places to explore.',
    color: 'sky',
    icon: 'map',
    image: '/goal-types/travel.png',
  },
  {
    slug: 'skill-mastery',
    name: 'Skill Mastery',
    description: 'Deliberate practice toward real expertise.',
    color: 'violet',
    icon: 'sword',
    image: '/goal-types/skill-mastery.png',
  },
  {
    slug: 'adventure',
    name: 'Adventure',
    description: 'Bucket-list challenges and bold experiences.',
    color: 'indigo',
    icon: 'mountain',
    image: '/goal-types/adventure.png',
  },
]

export function systemGoalType(slug: string): SystemGoalType | null {
  return SYSTEM_GOAL_TYPES.find((t) => t.slug === slug) ?? null
}

function assertCanEditType(
  type: Doc<'goalTypes'> | null,
  userId: Id<'users'>,
): asserts type is Doc<'goalTypes'> {
  if (!type) {
    throw new ConvexError('Goal type not found')
  }
  if (type.creatorId !== userId) {
    throw new ConvexError('Forbidden')
  }
}

async function customTypesForUser(ctx: QueryCtx, userId: Id<'users'>) {
  return await ctx.db
    .query('goalTypes')
    .withIndex('by_creator', (q) => q.eq('creatorId', userId))
    .take(200)
}

function assertNameAvailable(
  name: string,
  custom: Doc<'goalTypes'>[],
  excludeId?: Id<'goalTypes'>,
) {
  const lower = name.toLowerCase()
  if (SYSTEM_GOAL_TYPES.some((t) => t.name.toLowerCase() === lower)) {
    throw new ConvexError('A built-in type with this name already exists')
  }
  if (
    custom.some((t) => t._id !== excludeId && t.name.toLowerCase() === lower)
  ) {
    throw new ConvexError('A type with this name already exists')
  }
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const custom = await customTypesForUser(ctx, userId)
    return {
      system: SYSTEM_GOAL_TYPES,
      custom,
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    color: v.optional(v.string()),
    icon: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const name = args.name.trim()
    if (!name) throw new ConvexError('Name is required')
    const custom = await customTypesForUser(ctx, userId)
    assertNameAvailable(name, custom)
    const trimmedIcon = args.icon?.trim() ?? ''
    const icon = trimmedIcon === '' ? null : trimmedIcon
    const trimmedDescription = args.description?.trim() ?? ''
    const description = trimmedDescription === '' ? null : trimmedDescription
    const color = args.color?.trim() || 'slate'
    return await ctx.db.insert('goalTypes', {
      creatorId: userId,
      name,
      description,
      color,
      icon,
      updatedAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('goalTypes'),
    name: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    color: v.optional(v.string()),
    icon: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const type = await ctx.db.get(args.id)
    assertCanEditType(type, userId)
    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) {
      const trimmed = args.name.trim()
      if (!trimmed) throw new ConvexError('Name is required')
      if (trimmed.toLowerCase() !== type.name.toLowerCase()) {
        const custom = await customTypesForUser(ctx, userId)
        assertNameAvailable(trimmed, custom, args.id)
      }
      patch.name = trimmed
    }
    if (args.description !== undefined) {
      if (args.description === null) {
        patch.description = null
      } else {
        const trimmed = args.description.trim()
        patch.description = trimmed === '' ? null : trimmed
      }
    }
    if (args.color !== undefined) {
      const trimmed = args.color.trim()
      if (trimmed) patch.color = trimmed
    }
    if (args.icon !== undefined) {
      if (args.icon === null) {
        patch.icon = null
      } else {
        const trimmed = args.icon.trim()
        patch.icon = trimmed === '' ? null : trimmed
      }
    }
    if (Object.keys(patch).length === 0) return { changed: false }
    patch.updatedAt = Date.now()
    await ctx.db.patch(args.id, patch)
    return { changed: true }
  },
})

export const remove = mutation({
  args: { id: v.id('goalTypes') },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const type = await ctx.db.get(args.id)
    assertCanEditType(type, userId)
    const inUse = await ctx.db
      .query('goals')
      .withIndex('by_customType', (q) => q.eq('customTypeId', args.id))
      .take(1)
    if (inUse.length > 0) {
      throw new ConvexError(
        'This type is used by a goal. Change those goals first.',
      )
    }
    await ctx.db.delete(args.id)
  },
})
