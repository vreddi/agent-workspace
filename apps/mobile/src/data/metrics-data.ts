/**
 * Live Convex data hooks and pure helpers for per-goal numeric metrics on
 * mobile — parity with the web `metrics.tsx` flow: list metrics with computed
 * progress, read a metric's readings for the sparkline, and create/edit/delete
 * both metric definitions and individual readings.
 *
 * Read hooks return `undefined` while loading. The formatting/parsing helpers
 * are dependency-free (ported from apps/web metric-format) so cards, sheets,
 * and the chart can share one number/locale story.
 */
import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import type { MetricSummary } from '@convex/metrics'
import { useMutation, useQuery } from 'convex/react'

export type { MetricSummary }
export type MetricDirection = Doc<'metrics'>['direction']
export type MetricPoint = Doc<'metricPoints'>

/** Current epoch ms behind a module boundary — same purity dodge as goals. */
export function nowMs(): number {
  return Date.now()
}

// --- Read hooks --------------------------------------------------------------

/** Active metrics for a goal, each hydrated with latest reading + progress. */
export function useMetrics(
  goalId: Id<'goals'> | undefined,
): MetricSummary[] | undefined {
  return useQuery(api.metrics.listForGoal, goalId ? { goalId } : 'skip')
}

/** A metric's readings, oldest-first, bounded to the newest 500. */
export function useMetricPoints(
  metricId: Id<'metrics'> | undefined,
): MetricPoint[] | undefined {
  return useQuery(api.metrics.points, metricId ? { metricId } : 'skip')
}

// --- Mutations ---------------------------------------------------------------

export function useCreateMetric() {
  return useMutation(api.metrics.create)
}

export function useUpdateMetric() {
  return useMutation(api.metrics.update)
}

export function useRemoveMetric() {
  return useMutation(api.metrics.remove)
}

export function useAddPoint() {
  return useMutation(api.metrics.addPoint)
}

export function useUpdatePoint() {
  return useMutation(api.metrics.updatePoint)
}

export function useRemovePoint() {
  return useMutation(api.metrics.removePoint)
}

// --- Formatting --------------------------------------------------------------

/** Trim to at most 2 decimals without trailing zeros; integers stay integers. */
export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 100) / 100)
}

export function formatValue(n: number, unit: string): string {
  return unit ? `${formatNumber(n)} ${unit}` : formatNumber(n)
}

export function formatSignedDelta(n: number, unit: string): string {
  const sign = n > 0 ? '+' : n < 0 ? '−' : '±'
  return `${sign}${formatValue(Math.abs(n), unit)}`
}

export const DIRECTION_LABEL: Record<MetricDirection, string> = {
  decrease: 'Lower is better',
  increase: 'Higher is better',
}

// --- Parsing -----------------------------------------------------------------

/**
 * Parse a user-typed decimal, tolerating a comma decimal separator (locale
 * keyboards) — "1,5" -> 1.5. Returns null for blank or non-finite input, so
 * callers can treat null as "unset" (optional fields) or "invalid" (required).
 */
export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '.')
  if (trimmed === '') return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

/** True when `raw` is blank OR a finite number — i.e. a valid optional field. */
export function isValidOptionalNumber(raw: string): boolean {
  return raw.trim() === '' || parseDecimal(raw) !== null
}

/** Local noon for a day — a neutral effective time stable across time zones. */
export function toNoon(date: Date): number {
  const d = new Date(date)
  d.setHours(12, 0, 0, 0)
  return d.getTime()
}
