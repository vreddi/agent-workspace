# Metrics

A **metric** is a number you track over time against a goal — body weight for
a "lose weight" goal, a math score across a year's exams, weekly revenue for a
launch. You record readings as you go, and the goal detail page charts the
trend toward a target you want to hit by a target date. Metrics are numerical
only today; the schema is shaped so other value kinds can be added later
without a migration.

## Model

Tables live in `convex/schema.ts`; functions in `convex/metrics.ts`. Two tables
— a definition and its time series — kept separate on purpose.

- **`metrics`** — the *definition*, one row per metric per goal: `goalId`,
  denormalized `creatorId`, `name`, `unit` (`''` = unitless), a `kind`
  discriminator (`'numeric'` only, for now), a `direction` (`increase` |
  `decrease`), optional `startValue` / `targetValue` / `targetDate`, an
  `archivedAt` soft-archive flag, and `updatedAt`. Indexed `by_goal`.
- **`metricPoints`** — append-only *readings*, one row each: `metricId`,
  `creatorId`, `value`, `at`, and an optional `note`. Indexed
  `by_metric_at = [metricId, at]`.

`direction` is the pivot the rest of the feature reads from: for a `decrease`
metric (weight, resting heart rate) lower is better; for `increase` (exam
scores, distance) higher is better. It decides the target math and which way
the trend line should be heading.

`at` is the reading's *effective* time and is deliberately distinct from
`_creationTime`, so a reading can be back-dated ("I weighed 180 last Monday").
It is both the chart's x-axis and the sort key — the `by_metric_at` index keeps
readings in chronological order regardless of the order they were entered.

### Why two tables

Readings are the high-churn, unbounded part — a year of daily weigh-ins is 365
rows, and a goal may carry several metrics. They live in their own table rather
than as an array on the metric doc so that:

- a document never grows without bound (Convex guideline; keeps writes small
  and diffs cheap);
- reading history is a bounded, indexed **range scan** by `[metricId, at]`
  rather than a full-array rewrite on every new reading;
- recording a reading only invalidates the one metric's chart subscription,
  not every reader of the metric definition.

## Progress

`computeMetricProgress` (pure, exported, unit-tested) turns a `baseline`,
`latest`, `target`, and `direction` into the numbers the UI shows:

- **baseline** — `startValue` if set, else the earliest reading's value.
- **fractionToTarget** — how far along baseline → target the latest reading is,
  clamped to `[0, 1]` (overshoot reads as 100%). `null` when there's no target,
  no baseline, or `baseline === target`.
- **delta** — signed change `latest − baseline`.
- **reachedTarget** — whether the latest reading is at or past the target for
  its direction.

Like goal cost, this is **computed on read** — no denormalized counters to
drift out of sync under Convex reactivity.

## Reads stay cheap

The two read paths are both bounded and index-only:

- **`metrics.listForGoal`** hydrates each metric with its summary using exactly
  two single-row indexed lookups — the earliest and latest readings
  (`by_metric_at`, ascending and descending `.take(1)`). No point scan, so
  listing a goal's metrics is O(metrics) no matter how much history each one
  has.
- **`metrics.points`** returns the most-recent `METRIC_POINT_LIMIT` (500)
  readings, oldest-first, for the chart — a capped descending `.take` on
  `by_metric_at`, then reversed.

Nothing uses `.filter()` or `.collect()`; every query is an index scan with a
`.take` bound, per the Convex guidelines.

### Scale path

If a single metric ever outgrows the 500-point chart window, the fix is
server-side **downsampling** (bucket readings by day/week and return one point
per bucket), *not* lifting the cap — the same "reach for it only when scale
demands" posture the goal cost totals take. The `by_metric_at` range index is
already the right shape to scan a bucket window.

## Ownership & cascade

Access to a metric is exactly access to its goal. Every metric and point
mutation resolves the caller with `requireUserId`, then authorizes through the
goal's `assertCanEditGoal` (both exported from `goals.ts`; the import is
one-way — `goals.ts` never imports `metrics.ts`, so the module graph stays
acyclic). Deleting a metric removes its readings in bounded batches; deleting a
goal cascades to its metrics and their readings (inlined in `goals.remove`).
Archiving a metric (`update({ archived: true })`) hides it from
`listForGoal` while keeping its history intact.

## Charting

The goal detail page (`apps/web/src/routes/_authenticated/goals.$goalId.tsx`)
renders a `MetricsSection`. Each metric is a card with its latest value,
delta, a progress bar, an inline "log a reading" form, and a line chart:

- the **actual** readings (solid line),
- a dashed **on-pace guide** — the straight line from
  `(firstReading, baseline)` to `(targetDate, target)`, i.e. the trend you'd
  have to follow to hit the target by its date, and
- a horizontal **target** reference line.

Charts use the shadcn chart primitive (`@org/ui/components/chart`, a thin
wrapper over **recharts**) themed from the `--chart-*` CSS variables. Because
recharts is heavy, the chart lives in its own module
(`metric-chart.tsx`) and is loaded with `React.lazy`, so it lands in a separate
async chunk instead of the goal-detail route bundle — the route's core (header,
board) stays interactive while the chart code streams in. The whole metrics
subtree renders inside `<Authenticated>`, so it's client-only and recharts
never enters the SSR/Workers bundle path at runtime.

## Testing

`convex/metrics.test.ts` covers the logic-heavy paths with `convex-test`:
progress math (both directions, clamping, null cases), baseline/latest
derivation, back-dated ordering, ownership rejection, value validation, and the
metric-level and goal-level delete cascades. The chart primitive is a visual
component, so it's exercised by a Storybook story
(`packages/ui/src/components/chart.stories.tsx`) rather than a test.
