import type { Doc } from '@convex/_generated/dataModel'

// Shared, dependency-free formatting for metric values and dates. Kept apart
// from the chart module so the (recharts-heavy) chart can be lazy-loaded
// without dragging these helpers — or the card that uses them — along.

// Trim to at most 2 decimals without trailing zeros; integers stay integers.
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

export function msToDateInputValue(ms: number): string {
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Measurements land at local noon — a neutral time that keeps day boundaries
// stable across time zones on the chart's x-axis.
export function dateInputToNoonMs(value: string): number | null {
  if (!value) return null
  const ms = new Date(`${value}T12:00:00`).getTime()
  return Number.isFinite(ms) ? ms : null
}

export function formatAxisDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatLongDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const DIRECTION_LABEL: Record<Doc<'metrics'>['direction'], string> = {
  decrease: 'Lower is better',
  increase: 'Higher is better',
}
