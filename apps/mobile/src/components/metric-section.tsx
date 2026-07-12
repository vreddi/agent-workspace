/**
 * Per-goal numeric metrics for the mobile goal detail screen — parity with the
 * web MetricsSection. Renders a labelled section with an "Add metric"
 * affordance and a list of MetricCards; each card shows the latest value, its
 * delta from baseline, a progress bar toward target, and a react-native-svg
 * sparkline. Tapping a card opens a detail sheet (full readings, edit/delete);
 * a quick "Log reading" button logs a new reading inline.
 *
 * Create/edit of the metric definition lives in the goal/metric modal route;
 * reading capture and the detail view are self-contained bottom sheets here.
 */
import type { Id } from '@convex/_generated/dataModel'
import { formatDateLong } from '@org/app-core'
import { radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react-native'
import { useState, type ReactNode } from 'react'
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  confirmDestructive,
  DateFieldRow,
  FooterButton,
} from '@/components/forms'
import { Sparkline } from '@/components/metric-chart'
import { AppText, Card, SectionLabel } from '@/components/ui'
import {
  DIRECTION_LABEL,
  formatSignedDelta,
  formatValue,
  nowMs,
  parseDecimal,
  toNoon,
  useAddPoint,
  useMetricPoints,
  useMetrics,
  useRemoveMetric,
  useRemovePoint,
  useUpdatePoint,
  type MetricPoint,
  type MetricSummary,
} from '@/data/metrics-data'
import { useTheme } from '@/theme/theme-context'

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data
    if (typeof data === 'string') return data
  }
  return err instanceof Error
    ? err.message
    : 'Something went wrong. Please try again.'
}

// --- Section -----------------------------------------------------------------

export function MetricsSection({
  goalId,
  goalDeadline,
}: {
  goalId: Id<'goals'>
  goalDeadline: number
}) {
  const { palette } = useTheme()
  const metrics = useMetrics(goalId)

  const openCreate = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push({
      pathname: '/goal/metric',
      params: { goalId, deadline: String(goalDeadline) },
    })
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <SectionLabel style={styles.sectionLabelReset}>Metrics</SectionLabel>
        <Pressable
          onPress={openCreate}
          style={({ pressed }) => [
            styles.addPill,
            { backgroundColor: pressed ? palette.hover : palette.chipBg },
          ]}
        >
          <Plus size={14} color={palette.ink1} strokeWidth={2.5} />
          <AppText variant="meta" color={palette.ink1}>
            Add metric
          </AppText>
        </Pressable>
      </View>

      {metrics === undefined ? (
        <Card style={styles.stateCard}>
          <AppText variant="label" color={palette.ink3}>
            Loading metrics…
          </AppText>
        </Card>
      ) : metrics.length === 0 ? (
        <Card style={styles.stateCard}>
          <AppText variant="label">No metrics yet</AppText>
          <AppText variant="meta" color={palette.ink3} style={styles.emptyBody}>
            Track a number — like body weight or an exam score — then log
            readings over time to see it trend toward your target.
          </AppText>
          <Pressable
            onPress={openCreate}
            style={({ pressed }) => [
              styles.emptyButton,
              {
                borderColor: palette.divider,
                backgroundColor: pressed ? palette.hover : 'transparent',
              },
            ]}
          >
            <AppText variant="label" color={palette.ink1}>
              Add your first metric
            </AppText>
          </Pressable>
        </Card>
      ) : (
        <View style={styles.cardList}>
          {metrics.map((metric) => (
            <MetricCard
              key={metric._id}
              metric={metric}
              goalDeadline={goalDeadline}
            />
          ))}
        </View>
      )}
    </View>
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
  const { palette } = useTheme()
  const points = useMetricPoints(metric._id)
  const [detailOpen, setDetailOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const { progress } = metric
  const pct =
    progress.fractionToTarget !== null
      ? Math.round(progress.fractionToTarget * 100)
      : null
  const reached = progress.reachedTarget

  const spark = points ? points.map((p) => ({ at: p.at, value: p.value })) : []

  return (
    <Card style={styles.metricCard}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          setDetailOpen(true)
        }}
        style={({ pressed }) => [
          styles.cardBody,
          { backgroundColor: pressed ? palette.hover : 'transparent' },
        ]}
      >
        <View style={styles.cardHead}>
          <View style={styles.flex}>
            <AppText variant="heading" numberOfLines={1}>
              {metric.name}
            </AppText>
            <AppText variant="meta" color={palette.ink3}>
              {DIRECTION_LABEL[metric.direction]}
              {metric.targetValue !== null
                ? ` · target ${formatValue(metric.targetValue, metric.unit)}`
                : ''}
            </AppText>
          </View>
          <ChevronRight size={18} color={palette.ink4} />
        </View>

        <View style={styles.valueRow}>
          <View style={styles.flex}>
            <AppText variant="hero">
              {metric.latest
                ? formatValue(metric.latest.value, metric.unit)
                : '—'}
            </AppText>
            <AppText variant="meta" color={palette.ink3}>
              {metric.latest
                ? `as of ${formatDateLong(new Date(metric.latest.at))}`
                : 'No readings yet'}
            </AppText>
          </View>
          {progress.delta !== null ? (
            <View style={styles.deltaCol}>
              <AppText
                variant="label"
                color={reached ? palette.accentInk : palette.ink2}
              >
                {formatSignedDelta(progress.delta, metric.unit)}
              </AppText>
              {pct !== null ? (
                <AppText variant="meta" color={palette.ink3}>
                  {reached ? 'Target reached' : `${pct}% there`}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>

        {pct !== null ? (
          <View style={[styles.track, { backgroundColor: palette.chipBg }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: reached ? palette.accent : palette.accentInk,
                  width: `${Math.min(100, Math.max(pct, 2))}%`,
                },
              ]}
            />
          </View>
        ) : null}

        <Sparkline
          points={spark}
          targetValue={metric.targetValue}
          reachedTarget={reached}
        />
      </Pressable>

      <View
        style={[styles.cardDivider, { backgroundColor: palette.divider }]}
      />
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          setLogOpen(true)
        }}
        style={({ pressed }) => [
          styles.logButton,
          { backgroundColor: pressed ? palette.hover : 'transparent' },
        ]}
      >
        <Plus size={16} color={palette.accentInk} strokeWidth={2.5} />
        <AppText variant="label" color={palette.accentInk}>
          Log reading
        </AppText>
      </Pressable>

      {logOpen ? (
        <ReadingSheet
          metric={metric}
          point={null}
          onClose={() => setLogOpen(false)}
        />
      ) : null}
      <MetricDetailSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        metric={metric}
        goalDeadline={goalDeadline}
      />
    </Card>
  )
}

// --- Detail sheet ------------------------------------------------------------

function MetricDetailSheet({
  open,
  onClose,
  metric,
  goalDeadline,
}: {
  open: boolean
  onClose: () => void
  metric: MetricSummary
  goalDeadline: number
}) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const points = useMetricPoints(open ? metric._id : undefined)
  const removeMetric = useRemoveMetric()
  // null = closed · 'new' = add · MetricPoint = edit that reading.
  const [reading, setReading] = useState<MetricPoint | 'new' | null>(null)

  // Newest first for the history list.
  const history = points ? [...points].reverse() : []

  const handleEdit = () => {
    onClose()
    router.push({
      pathname: '/goal/metric',
      params: {
        goalId: metric.goalId,
        metricId: metric._id,
        deadline: String(goalDeadline),
      },
    })
  }

  const handleDelete = () => {
    confirmDestructive({
      title: `Delete "${metric.name}"?`,
      message:
        'This also deletes every reading logged for it. This cannot be undone.',
      onConfirm: () => {
        removeMetric({ id: metric._id })
          .then(() => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            )
            onClose()
          })
          .catch((err) => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            )
            Alert.alert('Could not delete metric', errorMessage(err))
          })
      },
    })
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            styles.detailSheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.divider,
              paddingBottom: Math.max(insets.bottom, space.md),
            },
          ]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandleWrap}>
            <View
              style={[styles.sheetHandle, { backgroundColor: palette.ink4 }]}
            />
          </View>

          <View style={styles.detailHead}>
            <View style={styles.flex}>
              <AppText variant="title" numberOfLines={1}>
                {metric.name}
              </AppText>
              <AppText variant="meta" color={palette.ink3}>
                {DIRECTION_LABEL[metric.direction]}
                {metric.targetValue !== null
                  ? ` · target ${formatValue(metric.targetValue, metric.unit)}`
                  : ''}
              </AppText>
            </View>
          </View>

          <View style={styles.detailActions}>
            <DetailAction
              icon={<Pencil size={15} color={palette.ink1} />}
              label="Edit"
              onPress={handleEdit}
            />
            <DetailAction
              icon={<Plus size={15} color={palette.ink1} strokeWidth={2.5} />}
              label="Log reading"
              onPress={() => setReading('new')}
            />
            <DetailAction
              icon={<Trash2 size={15} color={palette.overdue} />}
              label="Delete"
              tint={palette.overdue}
              onPress={handleDelete}
            />
          </View>

          <ScrollView style={styles.historyList} bounces={false}>
            {points === undefined ? (
              <AppText
                variant="label"
                color={palette.ink3}
                style={styles.historyEmpty}
              >
                Loading readings…
              </AppText>
            ) : history.length === 0 ? (
              <AppText
                variant="label"
                color={palette.ink3}
                style={styles.historyEmpty}
              >
                No readings yet. Log one to start the trend.
              </AppText>
            ) : (
              history.map((point, index) => (
                <Pressable
                  key={point._id}
                  onPress={() => setReading(point)}
                  style={({ pressed }) => [
                    styles.historyRow,
                    index > 0 && {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: palette.divider,
                    },
                    {
                      backgroundColor: pressed ? palette.hover : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.flex}>
                    <AppText variant="label">
                      {formatValue(point.value, metric.unit)}
                    </AppText>
                    {point.note ? (
                      <AppText
                        variant="meta"
                        color={palette.ink3}
                        numberOfLines={1}
                      >
                        {point.note}
                      </AppText>
                    ) : null}
                  </View>
                  <AppText variant="meta" color={palette.ink3}>
                    {formatDateLong(new Date(point.at))}
                  </AppText>
                </Pressable>
              ))
            )}
          </ScrollView>

          {reading !== null ? (
            <ReadingSheet
              key={reading === 'new' ? 'new' : reading._id}
              metric={metric}
              point={reading === 'new' ? null : reading}
              onClose={() => setReading(null)}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function DetailAction({
  icon,
  label,
  onPress,
  tint,
}: {
  icon: ReactNode
  label: string
  onPress: () => void
  tint?: string
}) {
  const { palette } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.detailActionPill,
        { backgroundColor: pressed ? palette.hover : palette.chipBg },
      ]}
    >
      {icon}
      <AppText variant="meta" color={tint ?? palette.ink1}>
        {label}
      </AppText>
    </Pressable>
  )
}

// --- Reading sheet (add / edit a single reading) -----------------------------

// Mounted only while active (parent renders it conditionally, keyed by the
// reading being logged/edited), so its fields initialize fresh from props —
// no reset effect needed.
function ReadingSheet({
  onClose,
  metric,
  point,
}: {
  onClose: () => void
  metric: MetricSummary
  point: MetricPoint | null
}) {
  const { palette } = useTheme()
  const insets = useSafeAreaInsets()
  const addPoint = useAddPoint()
  const updatePoint = useUpdatePoint()
  const removePoint = useRemovePoint()

  const isEdit = point !== null
  const [value, setValue] = useState(point != null ? String(point.value) : '')
  const [date, setDate] = useState<Date>(new Date(point?.at ?? nowMs()))
  const [note, setNote] = useState(point?.note ?? '')
  const [busy, setBusy] = useState(false)

  const parsed = parseDecimal(value)
  const canSave = parsed !== null && !busy

  const save = async () => {
    if (parsed === null || busy) return
    setBusy(true)
    const at = toNoon(date)
    const trimmedNote = note.trim() || null
    try {
      if (isEdit) {
        await updatePoint({
          id: point._id,
          value: parsed,
          at,
          note: trimmedNote,
        })
      } else {
        await addPoint({
          metricId: metric._id,
          value: parsed,
          at,
          note: trimmedNote,
        })
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Could not save reading', errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const remove = () => {
    if (!point) return
    confirmDestructive({
      title: 'Delete reading?',
      message: 'This removes just this data point.',
      onConfirm: () => {
        removePoint({ id: point._id })
          .then(() => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            )
            onClose()
          })
          .catch((err) => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            )
            Alert.alert('Could not delete reading', errorMessage(err))
          })
      },
    })
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: palette.surface,
              borderColor: palette.divider,
              paddingBottom: Math.max(insets.bottom, space.md),
            },
          ]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandleWrap}>
            <View
              style={[styles.sheetHandle, { backgroundColor: palette.ink4 }]}
            />
          </View>
          <AppText variant="heading" style={styles.sheetTitle}>
            {isEdit ? 'Edit reading' : 'Log reading'}
          </AppText>

          <Card>
            <View style={styles.fieldRow}>
              <AppText variant="label" color={palette.ink2}>
                Value
              </AppText>
              <TextInput
                style={[styles.valueInput, { color: palette.ink1 }]}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
                placeholder={metric.unit ? `New ${metric.unit}` : 'New value'}
                placeholderTextColor={palette.ink3}
                autoFocus={!isEdit}
              />
            </View>
            <View
              style={[styles.rowDivider, { backgroundColor: palette.divider }]}
            />
            <DateFieldRow
              label="Effective date"
              value={date}
              onChange={(d) => d && setDate(d)}
            />
            <View
              style={[styles.rowDivider, { backgroundColor: palette.divider }]}
            />
            <View style={styles.noteRow}>
              <AppText variant="label" color={palette.ink2}>
                Note
              </AppText>
              <TextInput
                style={[styles.noteInput, { color: palette.ink1 }]}
                value={note}
                onChangeText={setNote}
                placeholder="Optional"
                placeholderTextColor={palette.ink3}
                multiline
              />
            </View>
          </Card>

          <FooterButton
            label={isEdit ? 'Save reading' : 'Log reading'}
            onPress={save}
            disabled={!canSave}
            loading={busy}
          />
          {isEdit ? (
            <Pressable onPress={remove} style={styles.deleteLink}>
              <AppText variant="label" color={palette.overdue}>
                Delete reading
              </AppText>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: space.md,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.sm,
  },
  sectionLabelReset: {
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  stateCard: {
    padding: space.xl,
    gap: space.sm,
    alignItems: 'flex-start',
  },
  emptyBody: {
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: space.sm,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardList: {
    gap: space.md,
  },
  metricCard: {
    padding: 0,
  },
  cardBody: {
    padding: space.lg,
    gap: space.md,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
  },
  flex: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.md,
  },
  deltaCol: {
    alignItems: 'flex-end',
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
  },
  // Sheets
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.sm,
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  detailSheet: {
    maxHeight: '85%',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
  },
  sheetTitle: {
    paddingHorizontal: space.xs,
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xs,
  },
  detailActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  detailActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  historyList: {
    maxHeight: 320,
  },
  historyEmpty: {
    paddingVertical: space.lg,
    paddingHorizontal: space.xs,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    paddingHorizontal: space.xs,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.lg,
    minHeight: 52,
    paddingVertical: space.sm,
  },
  valueInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '600',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
  },
  noteRow: {
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  noteInput: {
    fontSize: 15,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  deleteLink: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
})
