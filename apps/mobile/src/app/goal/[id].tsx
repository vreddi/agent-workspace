import type { Id } from '@convex/_generated/dataModel'
import type { GoalListItem } from '@convex/goals'
import { describeDeadline, formatDateLong } from '@org/app-core'
import { radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { CheckCircle2, Pencil, Plus, RotateCcw } from 'lucide-react-native'
import { cloneElement, useState, type ReactElement } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { confirmDestructive } from '@/components/forms'
import { AttachTasksSheet, GoalBoardCard } from '@/components/goal-board'
import { GoalTypeIcon } from '@/components/goal-type-icon'
import { MetricsSection } from '@/components/metric-section'
import { ScreenLoading } from '@/components/screen'
import { AppText, Card, SectionLabel } from '@/components/ui'
import {
  useAddTasksToGoal,
  useGoalRaw,
  useGoalStages,
  useMoveTaskStage,
  useRemoveGoal,
  useRemoveTaskFromGoal,
  useSetGoalStatus,
  nowMs,
  type BoardStage,
} from '@/data/goals-data'
import type { Task } from '@/data/hooks'
import { useTheme } from '@/theme/theme-context'

/** Deleted/foreign goal ids make `goals.get` throw — show this instead. */
export function ErrorBoundary() {
  const { palette } = useTheme()
  return (
    <View style={[styles.missing, { backgroundColor: palette.bg }]}>
      <AppText variant="heading">Goal not found</AppText>
      <AppText variant="label" color={palette.ink3}>
        It may have been deleted or archived.
      </AppText>
    </View>
  )
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data
    if (typeof data === 'string') return data
  }
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}

const STAGE_META: { stage: BoardStage; label: string }[] = [
  { stage: 'active', label: 'In progress' },
  { stage: 'inactive', label: 'To do' },
  { stage: 'complete', label: 'Done' },
]

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { palette } = useTheme()
  const goalId = id as Id<'goals'> | undefined
  const goal = useGoalRaw(goalId)
  const stages = useGoalStages(goalId)

  const setStatus = useSetGoalStatus()
  const removeGoal = useRemoveGoal()
  const moveTask = useMoveTaskStage()
  const detachTask = useRemoveTaskFromGoal()
  const addTasks = useAddTasksToGoal()
  const [attachOpen, setAttachOpen] = useState(false)

  if (goal === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <ScreenLoading />
      </View>
    )
  }

  const total = goal.progress.totalTasks
  const done = goal.progress.completeTasks
  const progress = total === 0 ? 0 : done / total
  const deadline = describeDeadline(goal.deadline, nowMs())

  const changeStatus = (status: 'active' | 'achieved' | 'archived') => {
    setStatus({ id: goal._id, status })
      .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
      .catch((err) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Alert.alert('Could not update goal', errorMessage(err))
      })
  }

  const handleDelete = () => {
    confirmDestructive({
      title: 'Delete goal?',
      message: 'Tasks on this goal are kept and simply detached.',
      onConfirm: () => {
        removeGoal({ id: goal._id })
          .then(() => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            router.back()
          })
          .catch((err) => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            Alert.alert('Could not delete goal', errorMessage(err))
          })
      },
    })
  }

  const handleMove = (taskId: Id<'tasks'>, stage: BoardStage) => {
    moveTask({ taskId, stage })
      .then(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
      .catch((err) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Alert.alert('Could not move task', errorMessage(err))
      })
  }

  const handleDetach = (taskId: Id<'tasks'>) => {
    detachTask({ taskId })
      .then(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))
      .catch((err) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Alert.alert('Could not remove task', errorMessage(err))
      })
  }

  const handleAdd = (taskIds: Id<'tasks'>[]) => {
    setAttachOpen(false)
    if (taskIds.length === 0) return
    addTasks({ goalId: goal._id, taskIds })
      .then(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
      .catch((err) => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        Alert.alert('Could not add tasks', errorMessage(err))
      })
  }

  const isEmpty = stages !== undefined && total === 0

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <GoalTypeIcon
          name={goal.type?.name ?? goal.title}
          color={goal.type?.color ?? 'slate'}
          icon={goal.type?.icon ?? null}
          size={56}
        />
        <AppText variant="hero">{goal.title}</AppText>
        <View style={styles.metaLine}>
          {goal.type && (
            <View style={[styles.typeChip, { backgroundColor: palette.chipBg }]}>
              <AppText variant="meta" color={palette.ink2}>
                {goal.type.name}
              </AppText>
            </View>
          )}
          {goal.status !== 'active' && (
            <View style={[styles.typeChip, { backgroundColor: palette.accentSoft }]}>
              <AppText variant="meta" color={palette.accentInk}>
                {goal.status === 'achieved' ? 'Achieved' : 'Archived'}
              </AppText>
            </View>
          )}
        </View>
      </View>

      <GoalActions goal={goal} onDelete={handleDelete} onStatus={changeStatus} />

      <Card style={styles.progressCard}>
        <View style={styles.progressHead}>
          <AppText variant="label" color={palette.ink2}>
            {total === 0 ? 'No tasks yet' : `${done} of ${total} tasks done`}
          </AppText>
          <AppText variant="heading" color={palette.accentInk}>
            {Math.round(progress * 100)}%
          </AppText>
        </View>
        <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
          <View
            style={[
              styles.fill,
              { backgroundColor: palette.accent, width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>
        <View style={styles.deadlineLine}>
          <AppText variant="meta" color={deadline.overdue ? palette.overdue : palette.ink3}>
            {deadline.label}
          </AppText>
          <AppText variant="meta" color={palette.ink3}>
            {formatDateLong(new Date(goal.deadline))}
          </AppText>
        </View>
      </Card>

      {goal.description ? (
        <Card style={styles.notes}>
          <AppText variant="caption">About</AppText>
          <AppText variant="label" color={palette.ink2} style={styles.notesBody}>
            {goal.description}
          </AppText>
        </Card>
      ) : null}

      {/* metrics-section-anchor: a later agent inserts <MetricsSection /> here,
          between the description and the board. Keep this the sole insertion
          point so that change stays a one-liner. */}
      <MetricsSection goalId={goal._id} goalDeadline={goal.deadline} />


      {stages === undefined ? (
        <ScreenLoading />
      ) : isEmpty ? (
        <Card style={styles.notes}>
          <AppText variant="label" color={palette.ink3}>
            No tasks on this goal yet. Add one below to start making progress.
          </AppText>
        </Card>
      ) : (
        STAGE_META.map(({ stage, label }) => {
          const tasks: Task[] = stages[stage]
          if (tasks.length === 0) return null
          return (
            <View key={stage}>
              <SectionLabel>{label}</SectionLabel>
              <Card>
                {tasks.map((task, i) => (
                  <GoalBoardCard
                    key={task.id}
                    task={task}
                    stage={stage}
                    showDivider={i > 0}
                    onMove={(next) => handleMove(task.id, next)}
                    onDetach={() => handleDetach(task.id)}
                  />
                ))}
              </Card>
            </View>
          )
        })
      )}

      <View style={styles.footerActions}>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            router.push({ pathname: '/task/new', params: { goalId: goal._id } })
          }}
          style={({ pressed }) => [
            styles.primaryAction,
            { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Plus size={18} color="#ffffff" strokeWidth={2.5} />
          <AppText variant="label" color="#ffffff">
            Add task
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setAttachOpen(true)
          }}
          style={({ pressed }) => [
            styles.secondaryAction,
            { borderColor: palette.divider, backgroundColor: pressed ? palette.hover : 'transparent' },
          ]}
        >
          <AppText variant="label" color={palette.ink1}>
            Add existing tasks
          </AppText>
        </Pressable>
      </View>

      <AttachTasksSheet open={attachOpen} onClose={() => setAttachOpen(false)} onConfirm={handleAdd} />
    </ScrollView>
  )
}

function GoalActions({
  goal,
  onStatus,
  onDelete,
}: {
  goal: GoalListItem
  onStatus: (status: 'active' | 'achieved' | 'archived') => void
  onDelete: () => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.actionsRow}
    >
      <ActionPill
        icon={<Pencil size={15} />}
        label="Edit"
        onPress={() => router.push({ pathname: '/goal/edit', params: { id: goal._id } })}
      />
      {goal.status === 'active' ? (
        <ActionPill
          icon={<CheckCircle2 size={15} />}
          label="Mark achieved"
          onPress={() => onStatus('achieved')}
        />
      ) : (
        <ActionPill
          icon={<RotateCcw size={15} />}
          label="Reactivate"
          onPress={() => onStatus('active')}
        />
      )}
      {goal.status !== 'archived' && (
        <ActionPill label="Archive" onPress={() => onStatus('archived')} />
      )}
      <ActionPill label="Delete" destructive onPress={onDelete} />
    </ScrollView>
  )
}

function ActionPill({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon?: ReactElement<{ color?: string }>
  label: string
  onPress: () => void
  destructive?: boolean
}) {
  const { palette } = useTheme()
  const tint = destructive ? palette.overdue : palette.ink1
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: pressed ? palette.hover : palette.chipBg },
      ]}
    >
      {/* Lucide icons take a `color` prop; inject the pill tint here. */}
      {icon ? <View style={styles.pillIcon}>{cloneElement(icon, { color: tint })}</View> : null}
      <AppText variant="meta" color={tint}>
        {label}
      </AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: space.lg,
    gap: space.lg,
  },
  hero: {
    paddingHorizontal: space.sm,
    paddingVertical: space.md,
    gap: space.md,
    alignItems: 'flex-start',
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  actionsRow: {
    gap: space.sm,
    paddingHorizontal: space.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  pillIcon: {
    marginLeft: -2,
  },
  progressCard: {
    padding: space.xl,
    gap: space.lg,
  },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  deadlineLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  notes: {
    padding: space.xl,
    gap: space.sm,
  },
  notesBody: {
    lineHeight: 21,
  },
  footerActions: {
    gap: space.sm,
    paddingTop: space.sm,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 50,
    borderRadius: radius.md,
  },
  secondaryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.xxl,
  },
})
