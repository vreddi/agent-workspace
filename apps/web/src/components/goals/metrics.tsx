import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import type { MetricSummary } from '@convex/metrics'
import { Button } from '@org/ui/components/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@org/ui/components/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@org/ui/components/dropdown-menu'
import { cn } from '@org/ui/lib/utils'
import { useMutation, useQuery } from 'convex/react'
import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react'
import {
  DIRECTION_LABEL,
  dateInputToNoonMs,
  formatLongDate,
  formatSignedDelta,
  formatValue,
  msToDateInputValue,
} from '~/components/goals/metric-format'
import { INPUT_CLASSES } from '~/components/goals/goal-ui'
import { useConfirm } from '~/components/ui/confirm-dialog'

// The chart pulls in recharts; loaded lazily so it never weighs down the goal
// detail route's initial JS (see metric-chart.tsx).
const MetricChart = lazy(() => import('~/components/goals/metric-chart'))

// --- Section -----------------------------------------------------------------

export function MetricsSection({
  goalId,
  goalDeadline,
}: {
  goalId: Id<'goals'>
  goalDeadline: number
}) {
  const metrics = useQuery(api.metrics.listForGoal, { goalId })
  const [addOpen, setAddOpen] = useState(false)

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Metrics</h2>
          <p className="text-xs text-muted-foreground">
            Track a number over time and watch it trend toward your target.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          Add metric
        </Button>
      </div>

      {metrics === undefined ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-xl border bg-muted/40"
            />
          ))}
        </div>
      ) : metrics.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">No metrics yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            Add a numerical metric — like body weight or an exam score — then
            log readings over time to see the trend toward your target.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setAddOpen(true)}
          >
            Add your first metric
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {metrics.map((metric) => (
            <MetricCard
              key={metric._id}
              metric={metric}
              goalDeadline={goalDeadline}
            />
          ))}
        </div>
      )}

      <MetricDrawer
        goalId={goalId}
        goalDeadline={goalDeadline}
        metric={null}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </section>
  )
}

// --- Card --------------------------------------------------------------------

function MetricCard({
  metric,
  goalDeadline,
}: {
  metric: MetricSummary
  goalDeadline: number
}) {
  const removeMetric = useMutation(api.metrics.remove)
  const updateMetric = useMutation(api.metrics.update)
  const { confirm, confirmDialog } = useConfirm()
  const [editOpen, setEditOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { progress } = metric
  const pct =
    progress.fractionToTarget !== null
      ? Math.round(progress.fractionToTarget * 100)
      : null

  async function handleDelete() {
    const ok = await confirm({
      title: `Delete the "${metric.name}" metric?`,
      description: 'This deletes all its readings and cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    setError(null)
    try {
      await removeMetric({ id: metric._id })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete metric')
    }
  }

  async function handleArchive() {
    setError(null)
    try {
      await updateMetric({ id: metric._id, archived: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive metric')
    }
  }

  return (
    <div className="flex flex-col rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{metric.name}</h3>
          <p className="text-xs text-muted-foreground">
            {DIRECTION_LABEL[metric.direction]}
            {metric.targetValue !== null && (
              <>
                {' · target '}
                <span className="tabular-nums">
                  {formatValue(metric.targetValue, metric.unit)}
                </span>
              </>
            )}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Metric actions"
              className="shrink-0 rounded-md px-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              ⋯
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                void handleArchive()
              }}
            >
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                void handleDelete()
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold tabular-nums leading-none">
            {metric.latest
              ? formatValue(metric.latest.value, metric.unit)
              : '—'}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {metric.latest
              ? `as of ${formatLongDate(metric.latest.at)}`
              : 'No readings yet'}
          </div>
        </div>
        <div className="text-right">
          {progress.delta !== null && (
            <div
              className={cn(
                'text-sm font-medium tabular-nums',
                metric.progress.reachedTarget
                  ? 'text-emerald-600'
                  : 'text-muted-foreground',
              )}
            >
              {formatSignedDelta(progress.delta, metric.unit)}
            </div>
          )}
          {pct !== null && (
            <div className="text-xs text-muted-foreground">
              {metric.progress.reachedTarget
                ? 'Target reached'
                : `${pct}% there`}
            </div>
          )}
        </div>
      </div>

      {pct !== null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              metric.progress.reachedTarget
                ? 'bg-emerald-500 dark:bg-emerald-400/80'
                : 'bg-primary dark:bg-muted-foreground',
            )}
            style={{ width: `${Math.min(100, Math.max(pct, 2))}%` }}
          />
        </div>
      )}

      <div className="mt-4">
        <MetricChartPanel metric={metric} goalDeadline={goalDeadline} />
      </div>

      <AddReadingForm metric={metric} />

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <MetricDrawer
        goalId={metric.goalId}
        goalDeadline={goalDeadline}
        metric={metric}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
      {confirmDialog}
    </div>
  )
}

// --- Chart panel -------------------------------------------------------------

const CHART_SKELETON = (
  <div className="h-44 animate-pulse rounded-lg bg-muted/40" />
)

// Owns the readings subscription and the load/empty states so the recharts
// bundle only downloads once there's data to draw.
function MetricChartPanel({
  metric,
  goalDeadline,
}: {
  metric: MetricSummary
  goalDeadline: number
}) {
  const points = useQuery(api.metrics.points, { metricId: metric._id })

  if (points === undefined) return CHART_SKELETON

  return (
    <Suspense fallback={CHART_SKELETON}>
      <MetricChart
        metric={metric}
        points={points.map((p) => ({ at: p.at, value: p.value }))}
        goalDeadline={goalDeadline}
      />
    </Suspense>
  )
}

// --- Quick-add a reading -----------------------------------------------------

function AddReadingForm({ metric }: { metric: MetricSummary }) {
  const addPoint = useMutation(api.metrics.addPoint)
  const [value, setValue] = useState('')
  const [date, setDate] = useState(() => msToDateInputValue(Date.now()))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed === '' || submitting) return
    const numeric = Number(trimmed)
    if (!Number.isFinite(numeric)) {
      setError('Enter a number.')
      return
    }
    const at = dateInputToNoonMs(date) ?? Date.now()
    setSubmitting(true)
    setError(null)
    try {
      await addPoint({ metricId: metric._id, value: numeric, at })
      setValue('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log reading')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          step="any"
          inputMode="decimal"
          className={cn(INPUT_CLASSES, 'max-w-28 flex-none')}
          value={value}
          disabled={submitting}
          onChange={(e) => setValue(e.target.value)}
          placeholder={metric.unit ? `New ${metric.unit}` : 'New value'}
          aria-label={`New ${metric.name} reading`}
        />
        <input
          type="date"
          className={cn(INPUT_CLASSES, 'max-w-40 flex-none')}
          value={date}
          disabled={submitting}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Reading date"
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitting || value.trim() === ''}
        >
          {submitting ? 'Logging…' : 'Log'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}

// --- Create / edit drawer ----------------------------------------------------

function MetricDrawer({
  goalId,
  goalDeadline,
  metric,
  open,
  onClose,
}: {
  goalId: Id<'goals'>
  goalDeadline: number
  metric: MetricSummary | null
  open: boolean
  onClose: () => void
}) {
  const createMetric = useMutation(api.metrics.create)
  const updateMetric = useMutation(api.metrics.update)
  const isEdit = metric !== null

  const [name, setName] = useState(metric?.name ?? '')
  const [unit, setUnit] = useState(metric?.unit ?? '')
  const [direction, setDirection] = useState<Doc<'metrics'>['direction']>(
    metric?.direction ?? 'decrease',
  )
  const [startValue, setStartValue] = useState(
    metric?.startValue != null ? String(metric.startValue) : '',
  )
  const [targetValue, setTargetValue] = useState(
    metric?.targetValue != null ? String(metric.targetValue) : '',
  )
  const [targetDate, setTargetDate] = useState(
    msToDateInputValue(metric?.targetDate ?? goalDeadline),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The drawer stays mounted while closed, so refresh the fields each time it
  // opens: blank for "add", the metric's current values for "edit".
  useEffect(() => {
    if (!open) return
    setName(metric?.name ?? '')
    setUnit(metric?.unit ?? '')
    setDirection(metric?.direction ?? 'decrease')
    setStartValue(metric?.startValue != null ? String(metric.startValue) : '')
    setTargetValue(
      metric?.targetValue != null ? String(metric.targetValue) : '',
    )
    setTargetDate(msToDateInputValue(metric?.targetDate ?? goalDeadline))
    setError(null)
    setSaving(false)
  }, [open, metric, goalDeadline])

  function parseOptionalNumber(raw: string, label: string): number | null {
    const trimmed = raw.trim()
    if (trimmed === '') return null
    const n = Number(trimmed)
    if (!Number.isFinite(n)) throw new Error(`${label} must be a number.`)
    return n
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Name is required.')
      return
    }
    let start: number | null
    let target: number | null
    try {
      start = parseOptionalNumber(startValue, 'Start value')
      target = parseOptionalNumber(targetValue, 'Target value')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid number')
      return
    }
    const targetDateMs =
      targetValue.trim() === '' ? null : dateInputToNoonMs(targetDate)

    setSaving(true)
    setError(null)
    try {
      if (isEdit) {
        await updateMetric({
          id: metric._id,
          name: trimmedName,
          unit: unit.trim(),
          direction,
          startValue: start,
          targetValue: target,
          targetDate: targetDateMs,
        })
      } else {
        await createMetric({
          goalId,
          name: trimmedName,
          unit: unit.trim(),
          direction,
          startValue: start,
          targetValue: target,
          targetDate: targetDateMs,
        })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save metric')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
      direction="right"
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-md">
        <DrawerHeader className="border-b">
          <DrawerTitle>{isEdit ? 'Edit metric' : 'New metric'}</DrawerTitle>
          <DrawerDescription>
            Track a number over time and trend it toward a target.
          </DrawerDescription>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex-1 space-y-4 p-5">
            <label className="block space-y-1 text-xs text-muted-foreground">
              <span>Name</span>
              <input
                className={INPUT_CLASSES}
                value={name}
                disabled={saving}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Body weight"
              />
            </label>

            <label className="block space-y-1 text-xs text-muted-foreground">
              <span>Unit (optional)</span>
              <input
                className={INPUT_CLASSES}
                value={unit}
                disabled={saving}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. lbs, pts, %"
              />
            </label>

            <div className="space-y-1 text-xs text-muted-foreground">
              <span>Direction</span>
              <div className="grid grid-cols-2 gap-2">
                {(['decrease', 'increase'] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    disabled={saving}
                    onClick={() => setDirection(dir)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-left text-xs transition',
                      direction === dir
                        ? 'border-ring bg-muted/60 text-foreground'
                        : 'text-muted-foreground hover:bg-muted/30',
                    )}
                  >
                    <div className="font-medium capitalize text-foreground">
                      {dir}
                    </div>
                    <div>{DIRECTION_LABEL[dir]}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                <span>Starting value (optional)</span>
                <input
                  type="number"
                  step="any"
                  className={INPUT_CLASSES}
                  value={startValue}
                  disabled={saving}
                  onChange={(e) => setStartValue(e.target.value)}
                  placeholder="e.g. 198"
                />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                <span>Target value (optional)</span>
                <input
                  type="number"
                  step="any"
                  className={INPUT_CLASSES}
                  value={targetValue}
                  disabled={saving}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. 175"
                />
              </label>
            </div>

            <label className="block space-y-1 text-xs text-muted-foreground">
              <span>Target date</span>
              <input
                type="date"
                className={INPUT_CLASSES}
                value={targetDate}
                disabled={saving || targetValue.trim() === ''}
                onChange={(e) => setTargetDate(e.target.value)}
              />
              <span className="text-[11px]">
                Defaults to the goal deadline. Only used when a target value is
                set.
              </span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DrawerFooter className="flex-row justify-end gap-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || name.trim() === ''}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create metric'}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
