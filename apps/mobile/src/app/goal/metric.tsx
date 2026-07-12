/**
 * Modal route for creating or editing a numeric metric. Reached from the
 * MetricsSection ("Add metric") and the metric detail sheet ("Edit"). Params:
 *   goalId    required — the owning goal
 *   deadline  ms string — default target date for new metrics
 *   metricId  optional — present in edit mode; its current values prefill
 *
 * Registers its own modal presentation in-route (no _layout change), matching
 * goal/new and goal/edit.
 */
import type { Id } from '@convex/_generated/dataModel'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { ScreenLoading } from '@/components/screen'
import { MetricForm, type MetricFormValues } from '@/components/metric-form'
import {
  nowMs,
  parseDecimal,
  toNoon,
  useCreateMetric,
  useMetrics,
  useUpdateMetric,
} from '@/data/metrics-data'
import { modalScreenOptions } from '@/lib/navigation'

export default function MetricFormScreen() {
  const params = useLocalSearchParams<{
    goalId: string
    deadline?: string
    metricId?: string
  }>()
  const goalId = params.goalId as Id<'goals'>
  const metricId = params.metricId as Id<'metrics'> | undefined
  const deadlineMs = params.deadline ? Number(params.deadline) : nowMs()

  const createMetric = useCreateMetric()
  const updateMetric = useUpdateMetric()
  const metrics = useMetrics(metricId ? goalId : undefined)
  const editing = metricId ? metrics?.find((m) => m._id === metricId) : null

  const buildArgs = (values: MetricFormValues) => {
    const target = parseDecimal(values.targetValue)
    return {
      name: values.name.trim(),
      unit: values.unit.trim(),
      direction: values.direction,
      startValue: parseDecimal(values.startValue),
      targetValue: target,
      // Only meaningful with a target value; noon-anchored for stable days.
      targetDate: target === null ? null : values.targetDate ? toNoon(values.targetDate) : null,
    }
  }

  const submitCreate = async (values: MetricFormValues) => {
    await createMetric({ goalId, ...buildArgs(values) })
    router.back()
  }

  const submitUpdate = async (values: MetricFormValues) => {
    if (!metricId) return
    await updateMetric({ id: metricId, ...buildArgs(values) })
    router.back()
  }

  // Edit mode waits for the metric to hydrate so fields start populated.
  if (metricId && metrics === undefined) {
    return (
      <>
        <Stack.Screen options={modalScreenOptions('Edit metric')} />
        <ScreenLoading />
      </>
    )
  }

  const initial: MetricFormValues = editing
    ? {
        name: editing.name,
        unit: editing.unit,
        direction: editing.direction,
        startValue: editing.startValue != null ? String(editing.startValue) : '',
        targetValue: editing.targetValue != null ? String(editing.targetValue) : '',
        targetDate: new Date(editing.targetDate ?? deadlineMs),
      }
    : {
        name: '',
        unit: '',
        direction: 'decrease',
        startValue: '',
        targetValue: '',
        targetDate: new Date(deadlineMs),
      }

  return (
    <>
      <Stack.Screen
        options={modalScreenOptions(metricId ? 'Edit metric' : 'New metric')}
      />
      <MetricForm
        initial={initial}
        submitLabel={metricId ? 'Save changes' : 'Create metric'}
        onSubmit={metricId ? submitUpdate : submitCreate}
      />
    </>
  )
}
