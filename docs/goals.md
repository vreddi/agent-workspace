# Goals

A **goal** is a specific, actionable objective the user commits to achieving
by a deadline — "run a marathon", "launch the side project". Goals are the
organizing construct for tasks. They replaced the earlier task-groups
feature, which has been removed.

## Model

Tables live in `convex/schema.ts`; functions in `convex/goals.ts`,
`convex/goalTypes.ts`, `convex/goalReminders.ts`.

- **`goals`** — title, optional description ("what this goal means to you"),
  required `deadline` (ms epoch), `status` (`active` | `achieved` |
  `archived`, with `achievedAt`), a type reference, and reminder bookkeeping
  (`reminderDaysBefore`, `lastRemindedAt`). There is deliberately no
  short/mid/long "term" field — the horizon is read from the deadline.
- **Goal types** — the category of goal. System types (Health & Wellness,
  Fitness, Business, Career, Relationships, Finance, Learning, Personal
  Growth) are code constants in `goalTypes.ts` referenced by `typeSlug`;
  user-defined types are `goalTypes` rows referenced by `customTypeId`.
  Exactly one of the two may be set. Custom types cannot be deleted while a
  goal references them.
- **Tasks under goals** — `tasks.goalId` attaches a task to a goal;
  `tasks.goalPosition` orders it on the board; `tasks.costDays` is the
  effort estimate in days.
- **Metrics under goals** — a goal can also track numerical metrics (weight,
  exam scores) that trend toward a target over time. See
  [metrics.md](./metrics.md); deleting a goal cascades to its metrics.

## Kanban board

The board has three stages that are a _projection_ of the existing
`task.status` — tasks carry no separate board state:

| Stage    | task.status   |
| -------- | ------------- |
| Inactive | `open`        |
| Active   | `in_progress` |
| Complete | `done`        |

Cancelled tasks fall off the board and out of cost totals.
`goals.moveTask` moves a card to a stage (updating status, `completedAt`,
and the audit trail) and positions it between neighbors using a midpoint
scheme (`goalPosition`).

## Cost

Goal progress is computed on read (`goals.list` / `goals.get`):
`totalCostDays` sums each non-cancelled task's effective cost —
its explicit `costDays`, or its `estimateMinutes` time estimate converted
to days (1 cost day = 24h) when no `costDays` is set. `completeCostDays`
sums the same over done tasks, and `uncostedTasks` counts tasks with
neither a cost nor an estimate (the totals undercount by these). The
fallback mirrors `effectiveCostDays` in `@org/app-core`, which the web
task cards use so a card's clock and the goal totals always agree.
Computed-on-read keeps the numbers consistent under Convex reactivity;
switch to denormalized counters only if goals grow past a few hundred
tasks.

## Reminders

A cron (`convex/crons.ts`) runs `goalReminders.remindDueGoals` hourly. It
scans active goals whose deadline is within `MAX_REMINDER_DAYS_BEFORE` via
the `by_status_deadline` index, and for each goal inside its own
`reminderDaysBefore` window inserts a `goalReminders` row (kind
`approaching` or `overdue`) — repeatedly, at most once per ~20h cooldown,
until the goal is achieved, archived, or its deadline moves (updating the
deadline resets `lastRemindedAt`). The web app surfaces unread reminders
and marks them read.

## Testing

Convex functions are tested with `convex-test` under the `edge-runtime`
vitest environment. Tests live next to the functions
(`convex/*.test.ts` — the Convex CLI does not deploy test files) and run
via the root `pnpm test` (config: `vitest.convex.config.mts`).
