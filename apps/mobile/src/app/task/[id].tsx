import type { Id } from '@convex/_generated/dataModel'
import { priority as priorityColors, radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Calendar,
  Clock,
  Flag,
  Gauge,
  Pencil,
  Target,
  Timer,
} from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { ScreenLoading } from '@/components/screen'
import { TaskActivitySection } from '@/components/task-activity'
import { TaskAssigneesSection } from '@/components/task-assignees'
import {
  fmtCost,
  fmtDateTime,
  fmtEstimate,
  fmtTimeOfDay,
  nowMs,
} from '@/components/task-format'
import { AppText, Card } from '@/components/ui'
import {
  ChipRowGroup,
  FooterButton,
  confirmDestructive,
} from '@/components/forms'
import type { TaskStatus } from '@/data/hooks'
import {
  DIFFICULTY_WORDS,
  PRIORITY_LABELS,
  STATUS_OPTIONS,
  useRemoveTask,
  useTaskDetail,
  useUpdateTask,
} from '@/data/tasks-data'
import { useTheme } from '@/theme/theme-context'
import type { ReactNode } from 'react'

/**
 * Deleted/foreign task ids make the `tasks.get` query throw — expo-router
 * renders this instead of crashing the app.
 */
export function ErrorBoundary() {
  const { palette } = useTheme()
  return (
    <View style={[styles.missing, { backgroundColor: palette.bg }]}>
      <AppText variant="heading">Task not found</AppText>
      <AppText variant="label" color={palette.ink3}>
        It may have been deleted or unshared.
      </AppText>
    </View>
  )
}

const STATUS_CHIPS = STATUS_OPTIONS.map((o) => ({
  label: o.label,
  value: o.value,
}))

function MetaRow({
  icon,
  label,
  value,
  valueColor,
  divider,
}: {
  icon: ReactNode
  label: string
  value: string
  valueColor?: string
  divider?: boolean
}) {
  const { palette } = useTheme()
  return (
    <View
      style={[
        styles.metaRow,
        divider && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: palette.divider,
        },
      ]}
    >
      {icon}
      <AppText variant="label" color={palette.ink2} style={{ flex: 1 }}>
        {label}
      </AppText>
      <AppText
        variant="label"
        color={valueColor ?? palette.ink1}
        numberOfLines={1}
        style={styles.metaValue}
      >
        {value}
      </AppText>
    </View>
  )
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { palette } = useTheme()
  const task = useTaskDetail(id as Id<'tasks'> | undefined)
  const updateTask = useUpdateTask()
  const removeTask = useRemoveTask()

  if (task === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <ScreenLoading />
      </View>
    )
  }

  const done = task.status === 'done'
  const open = task.status === 'open' || task.status === 'in_progress'
  const deadline = task.hardDeadline ?? task.softDeadline
  const overdue = open && deadline !== null && deadline < nowMs()
  const iconColor = palette.ink3

  const setStatus = (status: TaskStatus) => {
    if (status === task.status) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    updateTask({ id: task._id, status }).catch(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    })
  }

  const del = () => {
    confirmDestructive({
      title: 'Delete task?',
      message: 'This cannot be undone.',
      onConfirm: () => {
        removeTask(task._id)
          .then(() => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            )
            router.back()
          })
          .catch(() => {
            void Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            )
          })
      },
    })
  }

  return (
    <ScrollView
      style={{ backgroundColor: palette.bg }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        {task.emoji ? (
          <AppText style={styles.emoji}>{task.emoji}</AppText>
        ) : null}
        <AppText variant="hero">{task.title}</AppText>
        {done && task.completedAt !== null ? (
          <View
            style={[styles.statusChip, { backgroundColor: palette.chipBg }]}
          >
            <AppText variant="meta" color={palette.ink2}>
              Finished {fmtDateTime(task.completedAt)}
            </AppText>
          </View>
        ) : overdue && deadline !== null ? (
          <View
            style={[
              styles.statusChip,
              { backgroundColor: palette.overdueSoft },
            ]}
          >
            <AppText variant="meta" color={palette.overdue}>
              Was due {fmtDateTime(deadline)}
            </AppText>
          </View>
        ) : deadline !== null ? (
          <View
            style={[styles.statusChip, { backgroundColor: palette.chipBg }]}
          >
            <AppText variant="meta" color={palette.ink2}>
              Due {fmtDateTime(deadline)}
            </AppText>
          </View>
        ) : null}
      </View>

      <Card style={styles.statusCard}>
        <ChipRowGroup<TaskStatus>
          label="Status"
          value={task.status}
          options={STATUS_CHIPS}
          onChange={setStatus}
        />
      </Card>

      <Pressable
        onPress={() => router.push(`/task/${task._id}/edit`)}
        style={({ pressed }) => [
          styles.editRow,
          {
            backgroundColor: pressed ? palette.hover : palette.surface,
            borderColor: palette.divider,
          },
        ]}
      >
        <Pencil size={17} color={palette.accent} />
        <AppText variant="label" color={palette.accent}>
          Edit task
        </AppText>
      </Pressable>

      <DetailsCard task={task} iconColor={iconColor} open={open} />

      {task.goal ? (
        <Card>
          <MetaRow
            icon={<Target size={17} color={iconColor} />}
            label="Part of goal"
            value={task.goal.title}
          />
        </Card>
      ) : null}

      {task.description ? (
        <Card style={styles.notes}>
          <AppText variant="caption">Notes</AppText>
          <AppText
            variant="label"
            color={palette.ink2}
            style={styles.notesBody}
          >
            {task.description}
          </AppText>
        </Card>
      ) : null}

      <TaskAssigneesSection
        taskId={task._id}
        assignees={task.assignees}
        viewerId={task.viewerId}
        viewerIsCreator={task.viewerIsCreator}
      />

      <TaskActivitySection taskId={task._id} />

      {task.viewerIsCreator ? (
        <FooterButton label="Delete task" variant="destructive" onPress={del} />
      ) : null}
    </ScrollView>
  )
}

function DetailsCard({
  task,
  iconColor,
  open,
}: {
  task: NonNullable<ReturnType<typeof useTaskDetail>>
  iconColor: string
  open: boolean
}) {
  const { palette } = useTheme()
  const now = nowMs()
  const rows: ReactNode[] = []

  if (task.priority != null) {
    rows.push(
      <MetaRow
        key="priority"
        divider={rows.length > 0}
        icon={<Flag size={17} color={priorityColors[task.priority]} />}
        label="Priority"
        value={PRIORITY_LABELS[task.priority]}
      />,
    )
  }
  if (task.difficulty != null) {
    rows.push(
      <MetaRow
        key="difficulty"
        divider={rows.length > 0}
        icon={<Gauge size={17} color={iconColor} />}
        label="Difficulty"
        value={`${DIFFICULTY_WORDS[task.difficulty] ?? task.difficulty} (${task.difficulty}/5)`}
      />,
    )
  }
  if (task.estimateMinutes !== null) {
    rows.push(
      <MetaRow
        key="estimate"
        divider={rows.length > 0}
        icon={<Timer size={17} color={iconColor} />}
        label="Estimate"
        value={fmtEstimate(task.estimateMinutes)}
      />,
    )
  }
  if (task.costDays != null) {
    rows.push(
      <MetaRow
        key="cost"
        divider={rows.length > 0}
        icon={<Gauge size={17} color={iconColor} />}
        label="Cost"
        value={fmtCost(task.costDays)}
      />,
    )
  }
  if (task.softDeadline !== null) {
    rows.push(
      <MetaRow
        key="soft"
        divider={rows.length > 0}
        icon={<Calendar size={17} color={iconColor} />}
        label="Target date"
        value={fmtDateTime(task.softDeadline)}
        valueColor={
          open && task.softDeadline < now ? palette.overdue : undefined
        }
      />,
    )
  }
  if (task.hardDeadline !== null) {
    rows.push(
      <MetaRow
        key="hard"
        divider={rows.length > 0}
        icon={<Calendar size={17} color={iconColor} />}
        label="Hard deadline"
        value={fmtDateTime(task.hardDeadline)}
        valueColor={
          open && task.hardDeadline < now ? palette.overdue : undefined
        }
      />,
    )
  }
  if (task.scheduledStartMinutes != null) {
    const start = fmtTimeOfDay(task.scheduledStartMinutes)
    const end =
      task.estimateMinutes !== null
        ? fmtTimeOfDay(
            (task.scheduledStartMinutes + task.estimateMinutes) % (24 * 60),
          )
        : null
    rows.push(
      <MetaRow
        key="slot"
        divider={rows.length > 0}
        icon={<Clock size={17} color={iconColor} />}
        label="Time slot"
        value={end ? `${start} – ${end}` : start}
      />,
    )
  }

  if (rows.length === 0) return null
  return <Card>{rows}</Card>
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
  emoji: {
    fontSize: 40,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusCard: {
    paddingVertical: space.xs,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 46,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
  },
  metaValue: {
    maxWidth: '55%',
  },
  notes: {
    padding: space.xl,
    gap: space.sm,
  },
  notesBody: {
    lineHeight: 21,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.xxl,
  },
})
