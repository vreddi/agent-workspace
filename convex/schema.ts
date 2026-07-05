import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const taskStatus = v.union(
  v.literal('open'),
  v.literal('in_progress'),
  v.literal('done'),
  v.literal('cancelled'),
)

export const goalStatus = v.union(
  v.literal('active'),
  v.literal('achieved'),
  v.literal('archived'),
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
  // Custom, user-defined goal categories. System categories (health, fitness,
  // business, ...) are code constants in goalTypes.ts, not rows here.
  goalTypes: defineTable({
    creatorId: v.id('users'),
    name: v.string(),
    // Optional one-line description shown on the Manage types page. Optional
    // (not just nullable) so rows created before this field validate.
    description: v.optional(v.union(v.string(), v.null())),
    color: v.string(),
    icon: v.union(v.string(), v.null()),
    updatedAt: v.number(),
  }).index('by_creator', ['creatorId']),
  goals: defineTable({
    creatorId: v.id('users'),
    title: v.string(),
    description: v.union(v.string(), v.null()),
    // Achievement deadline (ms since epoch). Required — a goal without a
    // deadline is a wish.
    deadline: v.number(),
    status: goalStatus,
    achievedAt: v.union(v.number(), v.null()),
    // Exactly one of these may be set: a built-in category slug or a custom
    // goalTypes row. Both null = uncategorized.
    typeSlug: v.union(v.string(), v.null()),
    customTypeId: v.union(v.id('goalTypes'), v.null()),
    // Reminders start firing once the deadline is within this many days.
    reminderDaysBefore: v.number(),
    lastRemindedAt: v.union(v.number(), v.null()),
    updatedAt: v.number(),
  })
    .index('by_creator_status', ['creatorId', 'status'])
    .index('by_status_deadline', ['status', 'deadline'])
    .index('by_customType', ['customTypeId']),
  goalReminders: defineTable({
    goalId: v.id('goals'),
    userId: v.id('users'),
    kind: v.union(v.literal('approaching'), v.literal('overdue')),
    goalTitle: v.string(),
    deadline: v.number(),
    // Whole days until the deadline at the time the reminder fired; negative
    // once overdue.
    daysRemaining: v.number(),
    readAt: v.union(v.number(), v.null()),
  })
    .index('by_user_read', ['userId', 'readAt'])
    .index('by_goal', ['goalId']),
  tasks: defineTable({
    title: v.string(),
    description: v.union(v.string(), v.null()),
    // Optional emoji chosen at capture time, shown as the task's glyph.
    // Optional (not just nullable) so rows created before emoji existed
    // validate.
    emoji: v.optional(v.union(v.string(), v.null())),
    creatorId: v.id('users'),
    assigneeUserId: v.id('users'),
    // Full set of assignees (primary first). Optional for rows created before
    // multi-assign existed; readers should fall back to [assigneeUserId].
    assigneeUserIds: v.optional(v.array(v.id('users'))),
    status: taskStatus,
    completedAt: v.union(v.number(), v.null()),
    softDeadline: v.union(v.number(), v.null()),
    hardDeadline: v.union(v.number(), v.null()),
    estimateMinutes: v.union(v.number(), v.null()),
    // Goal this task contributes to, and its ordering within the goal's
    // kanban board. Optional for rows created before goals existed.
    goalId: v.optional(v.union(v.id('goals'), v.null())),
    goalPosition: v.optional(v.number()),
    // Effort estimate in days; goal cost totals sum these.
    costDays: v.optional(v.union(v.number(), v.null())),
    updatedAt: v.number(),
  })
    .index('by_assignee_status', ['assigneeUserId', 'status'])
    .index('by_goal_position', ['goalId', 'goalPosition']),
  agents: defineTable({
    ownerId: v.id('users'),
    name: v.string(),
    personality: v.union(v.string(), v.null()),
    // Model powering the agent. Dummy for now — no API keys or provider auth
    // are attached; this is just the user's selection.
    model: v.string(),
    sprite: v.union(
      v.object({ kind: v.literal('stub'), stubId: v.string() }),
      v.object({ kind: v.literal('custom'), sheetUrl: v.string() }),
    ),
    archivedAt: v.union(v.number(), v.null()),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_owner_archived', ['ownerId', 'archivedAt']),
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
