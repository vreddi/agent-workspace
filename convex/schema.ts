import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  }).index('by_externalId', ['externalId']),
  todos: defineTable({
    userId: v.id('users'),
    title: v.string(),
    completed: v.boolean(),
  }).index('by_user', ['userId']),
})
