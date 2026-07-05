# Task assignments

Tasks can be shared between any two accounts — there are no teams or
organizations. You and a friend can co-work a task, or you can create a task
and hand it to someone else entirely. Every task starts assigned to its
creator; assignment is then freely editable by anyone on the task.

## Data model

Assignment is a many-to-many relation, stored the standard way: a join table.

```
taskAssignments
  taskId        Id<'tasks'>
  userId        Id<'users'>
  assignedById  Id<'users'>   who made the assignment
  status        task status   denormalized copy of tasks.status

  by_task           [taskId]            all assignees of a task
  by_task_and_user  [taskId, userId]    membership / permission checks
  by_user_and_status [userId, status]   "my open tasks" in one index scan
```

Why not an array field on the task? Convex can't index into arrays, so
"every task assigned to me" would require scanning the whole tasks table.
The join table makes both directions (task → people, person → tasks) index
scans. The earlier `tasks.assigneeUserIds` array had exactly this flaw:
co-assignees could never see shared tasks in their lists.

Why denormalize `status` onto the row? The tasks page filters by status.
Without the copy, filtering "my done tasks" would read every assignment and
then every task. With it, the filter happens inside `by_user_and_status`.
The cost is a bounded fan-out (≤ `MAX_ASSIGNEES` = 10 rows) on every status
write, which must go through `syncAssignmentStatus` in
`convex/taskAssignments.ts` — both `tasks.update` and `goals.moveTask` do.

## Access rules

- **Read/edit**: the creator and every assignee (`canUserEditTask`).
- **Assign**: anyone who can edit may change the assignee set — including
  removing themselves ("leave") or handing the task off entirely. A task
  always keeps at least one assignee.
- **Delete**: creator only; it is destructive for everyone on the task.
- **Lists** (`tasks.list`): union of tasks you're assigned to and tasks you
  created, so delegated work stays visible to its creator.

User search (`users.search`) is deliberately an open directory: any account
can be found by name (full-text index) or email prefix and assigned. That's
the current product intent — friends sharing tasks, not tenant isolation.

## Migration (widen → migrate → narrow)

`tasks.assigneeUserId` / `assigneeUserIds` are deprecated, now optional, and
no longer written. Readers fall back to them for rows created before the
join table existed, and `tasks.list` keeps a legacy `by_assignee_status`
scan for the same reason (dual read).

After deploying, run the batched, idempotent, self-scheduling backfill once:

```
npx convex run migrations:backfillTaskAssignments
```

It converts the legacy fields into assignment rows and clears them. Once it
has finished, a follow-up deploy can drop the two deprecated fields, the
`by_assignee_status` index, the legacy fallbacks in
`convex/taskAssignments.ts` and `tasks.list`, and the migration itself.
