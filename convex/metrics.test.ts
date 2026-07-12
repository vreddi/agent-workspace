/// <reference types="vite/client" />
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import { Id } from './_generated/dataModel'
import schema from './schema'
import { computeMetricProgress } from './metrics'

const modules = import.meta.glob('./**/*.ts')

const DAY_MS = 24 * 60 * 60 * 1000

function setup() {
  return convexTest(schema, modules)
}

async function signUp(t: ReturnType<typeof setup>, externalId: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert('users', {
      externalId,
      email: `${externalId}@example.com`,
      name: externalId,
    })
  })
  return t.withIdentity({ subject: externalId })
}

type UserClient = Awaited<ReturnType<typeof signUp>>

function createGoal(
  asUser: UserClient,
  overrides: Record<string, unknown> = {},
) {
  return asUser.mutation(api.goals.create, {
    title: 'Lose weight',
    deadline: Date.now() + 90 * DAY_MS,
    ...overrides,
  })
}

function createMetric(
  asUser: UserClient,
  goalId: Id<'goals'>,
  overrides: Record<string, unknown> = {},
) {
  return asUser.mutation(api.metrics.create, {
    goalId,
    name: 'Body weight',
    unit: 'lbs',
    direction: 'decrease',
    ...overrides,
  })
}

// --- computeMetricProgress (pure) -------------------------------------------

describe('computeMetricProgress', () => {
  test('decrease: fraction of the way from baseline to target', () => {
    const p = computeMetricProgress({
      direction: 'decrease',
      baseline: 200,
      latest: 190,
      target: 180,
    })
    expect(p.delta).toBe(-10)
    expect(p.fractionToTarget).toBeCloseTo(0.5)
    expect(p.reachedTarget).toBe(false)
  })

  test('increase: fraction toward a higher target', () => {
    const p = computeMetricProgress({
      direction: 'increase',
      baseline: 60,
      latest: 90,
      target: 100,
    })
    expect(p.delta).toBe(30)
    expect(p.fractionToTarget).toBeCloseTo(0.75)
  })

  test('clamps overshoot to 1 and flags reached', () => {
    const p = computeMetricProgress({
      direction: 'decrease',
      baseline: 200,
      latest: 170,
      target: 180,
    })
    expect(p.fractionToTarget).toBe(1)
    expect(p.reachedTarget).toBe(true)
  })

  test('clamps regression to 0', () => {
    const p = computeMetricProgress({
      direction: 'decrease',
      baseline: 200,
      latest: 210,
      target: 180,
    })
    expect(p.fractionToTarget).toBe(0)
  })

  test('null fraction when target or baseline missing', () => {
    expect(
      computeMetricProgress({
        direction: 'decrease',
        baseline: 200,
        latest: 190,
        target: null,
      }).fractionToTarget,
    ).toBeNull()
    expect(
      computeMetricProgress({
        direction: 'decrease',
        baseline: null,
        latest: 190,
        target: 180,
      }).fractionToTarget,
    ).toBeNull()
  })

  test('null fraction when baseline equals target (no journey)', () => {
    expect(
      computeMetricProgress({
        direction: 'decrease',
        baseline: 180,
        latest: 180,
        target: 180,
      }).fractionToTarget,
    ).toBeNull()
  })
})

// --- create / listForGoal ----------------------------------------------------

describe('metrics.create', () => {
  test('creates a numeric metric with defaults and summarizes it', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const id = await createMetric(asUser, goalId, {
      startValue: 200,
      targetValue: 180,
    })
    const metrics = await asUser.query(api.metrics.listForGoal, { goalId })
    expect(metrics).toHaveLength(1)
    expect(metrics[0]).toMatchObject({
      _id: id,
      name: 'Body weight',
      unit: 'lbs',
      kind: 'numeric',
      direction: 'decrease',
      startValue: 200,
      targetValue: 180,
      latest: null,
      firstAt: null,
    })
    // Baseline falls back to startValue when no readings exist yet.
    expect(metrics[0]!.progress.baseline).toBe(200)
    expect(metrics[0]!.progress.latest).toBeNull()
  })

  test('rejects a blank name', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    await expect(
      createMetric(asUser, goalId, { name: '   ' }),
    ).rejects.toThrowError(/Name is required/)
  })

  test('cannot create a metric on someone else’s goal', async () => {
    const t = setup()
    const owner = await signUp(t, 'owner')
    const intruder = await signUp(t, 'intruder')
    const goalId = await createGoal(owner)
    await expect(createMetric(intruder, goalId)).rejects.toThrowError(
      /Forbidden/,
    )
  })
})

// --- readings ----------------------------------------------------------------

describe('metrics.addPoint', () => {
  test('records readings and derives baseline/latest from them', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const metricId = await createMetric(asUser, goalId, { targetValue: 180 })

    const base = Date.now()
    await asUser.mutation(api.metrics.addPoint, {
      metricId,
      value: 200,
      at: base,
    })
    await asUser.mutation(api.metrics.addPoint, {
      metricId,
      value: 190,
      at: base + 10 * DAY_MS,
    })

    const [metric] = await asUser.query(api.metrics.listForGoal, { goalId })
    // No startValue set, so baseline is the earliest reading.
    expect(metric!.progress.baseline).toBe(200)
    expect(metric!.latest).toMatchObject({ value: 190 })
    expect(metric!.progress.fractionToTarget).toBeCloseTo(0.5)
  })

  test('points come back oldest-first even when back-dated out of order', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const metricId = await createMetric(asUser, goalId)

    const base = Date.now()
    // Insert newest first, then a back-dated older reading.
    await asUser.mutation(api.metrics.addPoint, {
      metricId,
      value: 190,
      at: base,
    })
    await asUser.mutation(api.metrics.addPoint, {
      metricId,
      value: 200,
      at: base - 10 * DAY_MS,
    })

    const points = await asUser.query(api.metrics.points, { metricId })
    expect(points.map((p) => p.value)).toEqual([200, 190])
    // Latest by effective time is the newer (base) reading, not the last insert.
    const [metric] = await asUser.query(api.metrics.listForGoal, { goalId })
    expect(metric!.latest).toMatchObject({ value: 190, at: base })
    expect(metric!.firstAt).toBe(base - 10 * DAY_MS)
  })

  test('rejects non-finite values', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const metricId = await createMetric(asUser, goalId)
    await expect(
      asUser.mutation(api.metrics.addPoint, {
        metricId,
        value: Number.POSITIVE_INFINITY,
      }),
    ).rejects.toThrowError(/Value must be a number/)
  })

  test('cannot log a reading on a metric you do not own', async () => {
    const t = setup()
    const owner = await signUp(t, 'owner')
    const intruder = await signUp(t, 'intruder')
    const goalId = await createGoal(owner)
    const metricId = await createMetric(owner, goalId)
    await expect(
      intruder.mutation(api.metrics.addPoint, { metricId, value: 1 }),
    ).rejects.toThrowError(/Forbidden/)
  })
})

// --- deletion / cascade ------------------------------------------------------

describe('metrics.remove', () => {
  test('deletes the metric and all its readings', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const metricId = await createMetric(asUser, goalId)
    await asUser.mutation(api.metrics.addPoint, { metricId, value: 1 })
    await asUser.mutation(api.metrics.addPoint, { metricId, value: 2 })

    await asUser.mutation(api.metrics.remove, { id: metricId })

    const metrics = await asUser.query(api.metrics.listForGoal, { goalId })
    expect(metrics).toHaveLength(0)
    const orphanPoints = await t.run(async (ctx) =>
      ctx.db
        .query('metricPoints')
        .withIndex('by_metric_at', (q) => q.eq('metricId', metricId))
        .collect(),
    )
    expect(orphanPoints).toHaveLength(0)
  })
})

describe('goals.remove cascade', () => {
  test('deleting a goal removes its metrics and their readings', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const metricId = await createMetric(asUser, goalId)
    await asUser.mutation(api.metrics.addPoint, { metricId, value: 200 })
    await asUser.mutation(api.metrics.addPoint, { metricId, value: 190 })

    await asUser.mutation(api.goals.remove, { id: goalId })

    const leftoverMetrics = await t.run(async (ctx) =>
      ctx.db
        .query('metrics')
        .withIndex('by_goal', (q) => q.eq('goalId', goalId))
        .collect(),
    )
    const leftoverPoints = await t.run(async (ctx) =>
      ctx.db
        .query('metricPoints')
        .withIndex('by_metric_at', (q) => q.eq('metricId', metricId))
        .collect(),
    )
    expect(leftoverMetrics).toHaveLength(0)
    expect(leftoverPoints).toHaveLength(0)
  })
})

// --- archive -----------------------------------------------------------------

describe('metrics.update', () => {
  test('archiving hides a metric from the list without deleting readings', async () => {
    const t = setup()
    const asUser = await signUp(t, 'user_1')
    const goalId = await createGoal(asUser)
    const metricId = await createMetric(asUser, goalId)
    await asUser.mutation(api.metrics.addPoint, { metricId, value: 200 })

    await asUser.mutation(api.metrics.update, { id: metricId, archived: true })

    const metrics = await asUser.query(api.metrics.listForGoal, { goalId })
    expect(metrics).toHaveLength(0)
    // Readings survive so un-archiving restores the history.
    const points = await t.run(async (ctx) =>
      ctx.db
        .query('metricPoints')
        .withIndex('by_metric_at', (q) => q.eq('metricId', metricId))
        .collect(),
    )
    expect(points).toHaveLength(1)
  })
})
