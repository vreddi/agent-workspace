import { ConvexError, v } from 'convex/values'
import { mutation, query, QueryCtx, MutationCtx } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'
import { metricDirection } from './schema'
import { assertCanEditGoal } from './goals'
import { requireUserId } from './lib/auth'

// Chart reads are always bounded: at most this many of the most-recent
// readings come back per request. A metric that outgrows this window is the
// signal to add server-side downsampling (see docs/metrics.md), not to lift
// the cap.
export const METRIC_POINT_LIMIT = 500

// Light input bounds. Values themselves are unbounded numbers; only the
// human-facing strings are capped so a document can't balloon.
const MAX_NAME_LENGTH = 80
const MAX_UNIT_LENGTH = 16
const MAX_NOTE_LENGTH = 280

type MetricDirection = Doc<'metrics'>['direction']

// --- Validation helpers ------------------------------------------------------

function normalizeName(raw: string): string {
  const name = raw.trim()
  if (!name) throw new ConvexError('Name is required')
  if (name.length > MAX_NAME_LENGTH) {
    throw new ConvexError(`Name must be ${MAX_NAME_LENGTH} characters or fewer`)
  }
  return name
}

function normalizeUnit(raw: string): string {
  const unit = raw.trim()
  if (unit.length > MAX_UNIT_LENGTH) {
    throw new ConvexError(`Unit must be ${MAX_UNIT_LENGTH} characters or fewer`)
  }
  return unit
}

function normalizeNote(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const note = raw.trim()
  if (note === '') return null
  if (note.length > MAX_NOTE_LENGTH) {
    throw new ConvexError(`Note must be ${MAX_NOTE_LENGTH} characters or fewer`)
  }
  return note
}

// Optional finite number: null passes through, a present value must be finite.
function normalizeOptionalNumber(
  value: number | null | undefined,
  label: string,
): number | null {
  if (value == null) return null
  if (!Number.isFinite(value))
    throw new ConvexError(`${label} must be a number`)
  return value
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value))
    throw new ConvexError(`${label} must be a number`)
  return value
}

// --- Authorization helpers ---------------------------------------------------

// Loads a metric and authorizes the caller through its goal's ownership rule.
// Used for both reads and writes — access to a metric is exactly access to its
// goal.
async function requireMetric(
  ctx: QueryCtx,
  metricId: Id<'metrics'>,
  userId: Id<'users'>,
): Promise<Doc<'metrics'>> {
  const metric = await ctx.db.get(metricId)
  if (!metric) throw new ConvexError('Metric not found')
  const goal = await ctx.db.get(metric.goalId)
  assertCanEditGoal(goal, userId)
  return metric
}

async function requirePoint(
  ctx: QueryCtx,
  pointId: Id<'metricPoints'>,
  userId: Id<'users'>,
): Promise<Doc<'metricPoints'>> {
  const point = await ctx.db.get(pointId)
  if (!point) throw new ConvexError('Measurement not found')
  await requireMetric(ctx, point.metricId, userId)
  return point
}

// --- Progress computation ----------------------------------------------------

export type MetricProgress = {
  baseline: number | null
  latest: number | null
  target: number | null
  // Fraction 0..1 of the journey baseline -> target already covered. Null when
  // it can't be computed (no target, no baseline, or baseline === target).
  fractionToTarget: number | null
  // Signed change from baseline to latest (latest - baseline).
  delta: number | null
  reachedTarget: boolean
}

// Pure so it can be unit-tested and reused on the client. `direction` decides
// which way counts as progress; the fraction is clamped to [0, 1] for display
// (overshoot reads as 100%).
export function computeMetricProgress(args: {
  direction: MetricDirection
  baseline: number | null
  latest: number | null
  target: number | null
}): MetricProgress {
  const { direction, baseline, latest, target } = args
  const delta = baseline !== null && latest !== null ? latest - baseline : null

  let fractionToTarget: number | null = null
  let reachedTarget = false

  if (target !== null && latest !== null) {
    reachedTarget =
      direction === 'increase' ? latest >= target : latest <= target
  }
  if (
    baseline !== null &&
    latest !== null &&
    target !== null &&
    baseline !== target
  ) {
    const raw =
      direction === 'increase'
        ? (latest - baseline) / (target - baseline)
        : (baseline - latest) / (baseline - target)
    fractionToTarget = Math.max(0, Math.min(1, raw))
  }

  return { baseline, latest, target, fractionToTarget, delta, reachedTarget }
}

// --- Hydration ---------------------------------------------------------------

export type MetricSummary = Doc<'metrics'> & {
  // Most-recent reading by effective time, or null when none recorded yet.
  latest: { value: number; at: number } | null
  // Effective time of the earliest reading — the trend line's left anchor.
  firstAt: number | null
  progress: MetricProgress
}

// Summarizes a metric using two single-row indexed lookups (earliest +
// latest). No point scan, so listing stays O(metrics) regardless of how much
// history each metric has accumulated.
async function summarizeMetric(
  ctx: QueryCtx,
  metric: Doc<'metrics'>,
): Promise<MetricSummary> {
  const [firstRows, lastRows] = await Promise.all([
    ctx.db
      .query('metricPoints')
      .withIndex('by_metric_at', (q) => q.eq('metricId', metric._id))
      .take(1),
    ctx.db
      .query('metricPoints')
      .withIndex('by_metric_at', (q) => q.eq('metricId', metric._id))
      .order('desc')
      .take(1),
  ])
  const first = firstRows[0] ?? null
  const last = lastRows[0] ?? null
  const baseline = metric.startValue ?? (first ? first.value : null)
  const latest = last ? last.value : null
  const progress = computeMetricProgress({
    direction: metric.direction,
    baseline,
    latest,
    target: metric.targetValue,
  })
  return {
    ...metric,
    latest: last ? { value: last.value, at: last.at } : null,
    firstAt: first ? first.at : null,
    progress,
  }
}

// --- Queries -----------------------------------------------------------------

// Active (non-archived) metrics for a goal, each with a computed summary.
export const listForGoal = query({
  args: { goalId: v.id('goals') },
  handler: async (ctx, args): Promise<MetricSummary[]> => {
    const userId = await requireUserId(ctx)
    const goal = await ctx.db.get(args.goalId)
    assertCanEditGoal(goal, userId)
    const metrics = await ctx.db
      .query('metrics')
      .withIndex('by_goal', (q) => q.eq('goalId', args.goalId))
      .take(100)
    const active = metrics.filter((m) => m.archivedAt === null)
    // Newest metrics first so a just-created metric lands at the top.
    active.sort((a, b) => b._creationTime - a._creationTime)
    return await Promise.all(active.map((m) => summarizeMetric(ctx, m)))
  },
})

// Readings for one metric, oldest-first, ready to feed a line chart. Bounded to
// the most-recent METRIC_POINT_LIMIT readings.
export const points = query({
  args: { metricId: v.id('metrics'), limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<Doc<'metricPoints'>[]> => {
    const userId = await requireUserId(ctx)
    await requireMetric(ctx, args.metricId, userId)
    const limit = Math.min(
      Math.max(Math.floor(args.limit ?? METRIC_POINT_LIMIT), 1),
      METRIC_POINT_LIMIT,
    )
    // Take the newest `limit` by effective time, then flip to chronological
    // order for the chart.
    const newestFirst = await ctx.db
      .query('metricPoints')
      .withIndex('by_metric_at', (q) => q.eq('metricId', args.metricId))
      .order('desc')
      .take(limit)
    return newestFirst.reverse()
  },
})

// --- Mutations: metric definition -------------------------------------------

export const create = mutation({
  args: {
    goalId: v.id('goals'),
    name: v.string(),
    unit: v.optional(v.string()),
    direction: metricDirection,
    startValue: v.optional(v.union(v.number(), v.null())),
    targetValue: v.optional(v.union(v.number(), v.null())),
    targetDate: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args): Promise<Id<'metrics'>> => {
    const userId = await requireUserId(ctx)
    const goal = await ctx.db.get(args.goalId)
    assertCanEditGoal(goal, userId)
    const now = Date.now()
    return await ctx.db.insert('metrics', {
      goalId: args.goalId,
      creatorId: userId,
      name: normalizeName(args.name),
      unit: normalizeUnit(args.unit ?? ''),
      kind: 'numeric',
      direction: args.direction,
      startValue: normalizeOptionalNumber(args.startValue, 'Start value'),
      targetValue: normalizeOptionalNumber(args.targetValue, 'Target value'),
      targetDate: normalizeOptionalNumber(args.targetDate, 'Target date'),
      archivedAt: null,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id('metrics'),
    name: v.optional(v.string()),
    unit: v.optional(v.string()),
    direction: v.optional(metricDirection),
    startValue: v.optional(v.union(v.number(), v.null())),
    targetValue: v.optional(v.union(v.number(), v.null())),
    targetDate: v.optional(v.union(v.number(), v.null())),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ changed: boolean }> => {
    const userId = await requireUserId(ctx)
    const metric = await requireMetric(ctx, args.id, userId)
    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = normalizeName(args.name)
    if (args.unit !== undefined) patch.unit = normalizeUnit(args.unit)
    if (args.direction !== undefined) patch.direction = args.direction
    if (args.startValue !== undefined) {
      patch.startValue = normalizeOptionalNumber(args.startValue, 'Start value')
    }
    if (args.targetValue !== undefined) {
      patch.targetValue = normalizeOptionalNumber(
        args.targetValue,
        'Target value',
      )
    }
    if (args.targetDate !== undefined) {
      patch.targetDate = normalizeOptionalNumber(args.targetDate, 'Target date')
    }
    if (args.archived !== undefined) {
      const archived = metric.archivedAt !== null
      if (args.archived !== archived) {
        patch.archivedAt = args.archived ? Date.now() : null
      }
    }
    if (Object.keys(patch).length === 0) return { changed: false }
    patch.updatedAt = Date.now()
    await ctx.db.patch(args.id, patch)
    return { changed: true }
  },
})

// Deletes a metric's readings in bounded batches. Exported so callers that own
// the metric's lifecycle (e.g. a future bulk cleanup) can reuse it.
export async function deleteMetricPoints(
  ctx: MutationCtx,
  metricId: Id<'metrics'>,
): Promise<void> {
  while (true) {
    const batch = await ctx.db
      .query('metricPoints')
      .withIndex('by_metric_at', (q) => q.eq('metricId', metricId))
      .take(200)
    for (const point of batch) {
      await ctx.db.delete(point._id)
    }
    if (batch.length < 200) break
  }
}

export const remove = mutation({
  args: { id: v.id('metrics') },
  handler: async (ctx, args): Promise<void> => {
    const userId = await requireUserId(ctx)
    const metric = await requireMetric(ctx, args.id, userId)
    await deleteMetricPoints(ctx, metric._id)
    await ctx.db.delete(metric._id)
  },
})

// --- Mutations: readings -----------------------------------------------------

export const addPoint = mutation({
  args: {
    metricId: v.id('metrics'),
    value: v.number(),
    at: v.optional(v.number()),
    note: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args): Promise<Id<'metricPoints'>> => {
    const userId = await requireUserId(ctx)
    const metric = await requireMetric(ctx, args.metricId, userId)
    const value = requireFinite(args.value, 'Value')
    const at = requireFinite(args.at ?? Date.now(), 'Timestamp')
    const id = await ctx.db.insert('metricPoints', {
      metricId: metric._id,
      creatorId: userId,
      value,
      at,
      note: normalizeNote(args.note),
    })
    // Touch the metric so listeners on the definition re-run.
    await ctx.db.patch(metric._id, { updatedAt: Date.now() })
    return id
  },
})

export const updatePoint = mutation({
  args: {
    id: v.id('metricPoints'),
    value: v.optional(v.number()),
    at: v.optional(v.number()),
    note: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args): Promise<{ changed: boolean }> => {
    const userId = await requireUserId(ctx)
    const point = await requirePoint(ctx, args.id, userId)
    const patch: Record<string, unknown> = {}
    if (args.value !== undefined)
      patch.value = requireFinite(args.value, 'Value')
    if (args.at !== undefined) patch.at = requireFinite(args.at, 'Timestamp')
    if (args.note !== undefined) patch.note = normalizeNote(args.note)
    if (Object.keys(patch).length === 0) return { changed: false }
    await ctx.db.patch(args.id, patch)
    await ctx.db.patch(point.metricId, { updatedAt: Date.now() })
    return { changed: true }
  },
})

export const removePoint = mutation({
  args: { id: v.id('metricPoints') },
  handler: async (ctx, args): Promise<{ changed: boolean }> => {
    const userId = await requireUserId(ctx)
    const point = await requirePoint(ctx, args.id, userId)
    await ctx.db.delete(args.id)
    await ctx.db.patch(point.metricId, { updatedAt: Date.now() })
    return { changed: true }
  },
})
