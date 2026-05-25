import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const taskStatus = v.union(
  v.literal('open'),
  v.literal('in_progress'),
  v.literal('done'),
  v.literal('cancelled'),
)

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
  taskGroups: defineTable({
    creatorId: v.id('users'),
    name: v.string(),
    description: v.union(v.string(), v.null()),
    color: v.string(),
    icon: v.union(v.string(), v.null()),
    iconImageUrl: v.optional(v.union(v.string(), v.null())),
    position: v.number(),
    archivedAt: v.union(v.number(), v.null()),
    updatedAt: v.number(),
  })
    .index('by_creator', ['creatorId'])
    .index('by_creator_archived_position', ['creatorId', 'archivedAt', 'position']),
  tasks: defineTable({
    title: v.string(),
    description: v.union(v.string(), v.null()),
    creatorId: v.id('users'),
    assigneeUserId: v.id('users'),
    status: taskStatus,
    completedAt: v.union(v.number(), v.null()),
    softDeadline: v.union(v.number(), v.null()),
    hardDeadline: v.union(v.number(), v.null()),
    estimateMinutes: v.union(v.number(), v.null()),
    groupId: v.optional(v.union(v.id('taskGroups'), v.null())),
    groupPosition: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index('by_assignee_status', ['assigneeUserId', 'status'])
    .index('by_assignee_group_status', ['assigneeUserId', 'groupId', 'status'])
    .index('by_group_position', ['groupId', 'groupPosition']),
  taskEvents: defineTable({
    taskId: v.id('tasks'),
    actorId: v.id('users'),
    kind: v.union(v.literal('created'), v.literal('updated'), v.literal('deleted')),
    changes: v.array(
      v.object({
        field: v.string(),
        before: v.union(v.string(), v.null()),
        after: v.union(v.string(), v.null()),
      }),
    ),
  }).index('by_task', ['taskId']),
})
