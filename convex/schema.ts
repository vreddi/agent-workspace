import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const taskStatus = v.union(
  v.literal('open'),
  v.literal('in_progress'),
  v.literal('done'),
  v.literal('cancelled'),
)

// How critical it is to finish the task by its target date. Absent/null =
// no priority.
export const taskPriority = v.union(
  v.literal('high'),
  v.literal('medium'),
  v.literal('low'),
)

export const goalStatus = v.union(
  v.literal('active'),
  v.literal('achieved'),
  v.literal('archived'),
)

// Which way "progress" runs for a metric: are we pushing the value up (exam
// scores, distance run) or down (body weight, resting heart rate)? This drives
// the target math and which direction the trend line should be heading.
export const metricDirection = v.union(
  v.literal('increase'),
  v.literal('decrease'),
)

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
  })
    .index('by_externalId', ['externalId'])
    // Assignee picker: prefix match on email, full-text match on name.
    .index('by_email', ['email'])
    .searchIndex('search_name', { searchField: 'name' }),
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
  // A trackable numerical measure attached to a goal — "Body weight",
  // "Math exam score". This is the *definition* only; the readings live in
  // metricPoints. One row per metric per goal.
  metrics: defineTable({
    goalId: v.id('goals'),
    // Denormalized owner. Metrics are always reached through their goal, but
    // carrying the owner lets authz and any future "all my metrics" scan avoid
    // a second read, matching how the rest of the schema stamps creatorId.
    creatorId: v.id('users'),
    name: v.string(),
    // Short unit label rendered next to values ("lbs", "pts", "%"). '' =
    // unitless.
    unit: v.string(),
    // Value shape. Only 'numeric' exists today; it is discriminated now so
    // richer kinds (duration, currency, rating) can be added later without a
    // migration.
    kind: v.union(v.literal('numeric')),
    direction: metricDirection,
    // Optional baseline the trend starts from. Null = use the first reading.
    startValue: v.union(v.number(), v.null()),
    // Optional target and the date to hit it by. Null target = track only, no
    // goal line. Null date = fall back to the goal's own deadline.
    targetValue: v.union(v.number(), v.null()),
    targetDate: v.union(v.number(), v.null()),
    // Soft-archive so a metric can be retired without destroying its history.
    archivedAt: v.union(v.number(), v.null()),
    updatedAt: v.number(),
  }).index('by_goal', ['goalId']),
  // Append-only readings — the time series charted for a metric. Kept in their
  // own table (never an array on the metric doc) so a year of daily readings
  // stays a bounded, indexed range scan, and recording a new reading only
  // invalidates this one metric's chart subscription.
  metricPoints: defineTable({
    metricId: v.id('metrics'),
    // Who recorded the reading; self on create today, meaningful once goals can
    // be shared.
    creatorId: v.id('users'),
    value: v.number(),
    // Effective time of the reading (ms since epoch). Deliberately distinct
    // from _creationTime so a reading can be back-dated ("I weighed 180 last
    // Monday"); this is the chart's x-axis and the sort key.
    at: v.number(),
    note: v.union(v.string(), v.null()),
  }).index('by_metric_at', ['metricId', 'at']),
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
    // DEPRECATED: assignment lives in the taskAssignments join table now.
    // These two fields (and the by_assignee_status index) remain only so rows
    // written before that table existed keep validating and listing until
    // migrations.backfillTaskAssignments clears them; readers go through the
    // taskAssignments helpers, which fall back to these for unmigrated rows.
    assigneeUserId: v.optional(v.id('users')),
    assigneeUserIds: v.optional(v.array(v.id('users'))),
    status: taskStatus,
    completedAt: v.union(v.number(), v.null()),
    softDeadline: v.union(v.number(), v.null()),
    hardDeadline: v.union(v.number(), v.null()),
    estimateMinutes: v.union(v.number(), v.null()),
    // Optional (not just nullable) so rows created before these fields
    // existed validate.
    priority: v.optional(v.union(taskPriority, v.null())),
    // Perceived difficulty, 1 (easy) to 5 (challenging).
    difficulty: v.optional(v.union(v.number(), v.null())),
    // Planned slot within the target date's day: minutes after local
    // midnight when work starts. Slot length comes from estimateMinutes.
    scheduledStartMinutes: v.optional(v.union(v.number(), v.null())),
    // Goal this task contributes to, and its ordering within the goal's
    // kanban board. Optional for rows created before goals existed.
    goalId: v.optional(v.union(v.id('goals'), v.null())),
    goalPosition: v.optional(v.number()),
    // Effort estimate in days; goal cost totals sum these.
    costDays: v.optional(v.union(v.number(), v.null())),
    updatedAt: v.number(),
  })
    .index('by_assignee_status', ['assigneeUserId', 'status'])
    .index('by_creator_status', ['creatorId', 'status'])
    .index('by_goal_position', ['goalId', 'goalPosition']),
  // One row per (task, user) assignment — the many-to-many source of truth.
  // A task can be shared with any account, so "tasks assigned to me" must be
  // an index scan, which an array field on the task can never give us.
  taskAssignments: defineTable({
    taskId: v.id('tasks'),
    userId: v.id('users'),
    // Who made the assignment; self-assignment on create points at the creator.
    assignedById: v.id('users'),
    // Denormalized copy of tasks.status so a user's task list can filter by
    // status inside one index scan. Every task-status write must go through
    // syncAssignmentStatus in taskAssignments.ts to keep this in step.
    status: taskStatus,
  })
    .index('by_task', ['taskId'])
    .index('by_task_and_user', ['taskId', 'userId'])
    .index('by_user_and_status', ['userId', 'status']),
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
