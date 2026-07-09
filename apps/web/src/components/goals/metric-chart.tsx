import type { MetricSummary } from '@convex/metrics'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@org/ui/components/chart'
import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { formatAxisDate, formatLongDate, formatNumber } from './metric-format'

// Isolated in its own module and loaded via React.lazy from metrics.tsx, so
// recharts lands in a separate async chunk instead of the goal-detail route
// bundle. It only downloads once a goal actually has a metric to chart.

type ChartRow = { at: number; value: number | null; ideal: number | null }

// Points feed in oldest-first (see convex/metrics.ts `points`).
export default function MetricChart({
  metric,
  points,
  goalDeadline,
}: {
  metric: MetricSummary
  points: { at: number; value: number }[]
  goalDeadline: number
}) {
  const { rows, domainY, targetAt } = useMemo(() => {
    const startAt = metric.firstAt
    const baseline = metric.progress.baseline
    const target = metric.targetValue
    const tAt = metric.targetDate ?? goalDeadline

    // Linear "pace" guide from (startAt, baseline) to (targetAt, target): the
    // trend you'd need to follow to hit the target by its date.
    const guideActive =
      target !== null && baseline !== null && startAt !== null && tAt > startAt
    const idealAt = (at: number): number | null => {
      if (
        !guideActive ||
        startAt === null ||
        target === null ||
        baseline === null
      ) {
        return null
      }
      if (at < startAt || at > tAt) return null
      const frac = (at - startAt) / (tAt - startAt)
      return baseline + (target - baseline) * frac
    }

    // Union of reading times plus the guide endpoints, sorted ascending.
    const ats = new Set<number>(points.map((p) => p.at))
    if (guideActive && startAt !== null) {
      ats.add(startAt)
      ats.add(tAt)
    }
    const valueByAt = new Map<number, number>()
    for (const p of points) valueByAt.set(p.at, p.value)

    const sorted = [...ats].sort((a, b) => a - b)
    const rows: ChartRow[] = sorted.map((at) => ({
      at,
      value: valueByAt.has(at) ? valueByAt.get(at)! : null,
      ideal: idealAt(at),
    }))

    // Y domain padded to keep the line off the frame and always show target.
    const values: number[] = points.map((p) => p.value)
    if (target !== null) values.push(target)
    if (baseline !== null) values.push(baseline)
    let domainY: [number, number] | undefined
    if (values.length > 0) {
      const lo = Math.min(...values)
      const hi = Math.max(...values)
      const pad = (hi - lo) * 0.12 || Math.abs(hi) * 0.1 || 1
      domainY = [lo - pad, hi + pad]
    }

    return { rows, domainY, targetAt: guideActive ? tAt : null }
  }, [points, metric, goalDeadline])

  const config = {
    value: { label: metric.name, color: 'var(--chart-1)' },
    ideal: { label: 'On-pace', color: 'var(--chart-2)' },
  } satisfies ChartConfig

  if (rows.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
        Log a reading below to start the chart.
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="aspect-[16/10] w-full">
      <LineChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="at"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={formatAxisDate}
        />
        <YAxis
          width={40}
          domain={domainY ?? ['auto', 'auto']}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const at = payload?.[0]?.payload?.at
                return typeof at === 'number' ? formatLongDate(at) : ''
              }}
            />
          }
        />
        {metric.targetValue !== null && (
          <ReferenceLine
            y={metric.targetValue}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.5}
            strokeDasharray="3 3"
            label={{
              value: `Target ${formatNumber(metric.targetValue)}`,
              position: 'insideTopRight',
              fontSize: 10,
              fill: 'var(--muted-foreground)',
            }}
          />
        )}
        {targetAt !== null && (
          <Line
            dataKey="ideal"
            type="linear"
            stroke="var(--color-ideal)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        )}
        <Line
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ r: 2.5 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
