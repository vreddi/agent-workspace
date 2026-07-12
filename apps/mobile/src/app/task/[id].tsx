import type { Id } from '@convex/_generated/dataModel'
import { priority as priorityColors, radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams } from 'expo-router'
import { Bot, Calendar, Flag, Target, Users } from 'lucide-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ScreenLoading } from '@/components/screen'
import { AccentButton, AppText, Card } from '@/components/ui'
import { useTaskDetail, useToggleDone } from '@/data/hooks'
import { daysFromToday, formatDateLong } from '@/lib/dates'
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
  const toggleDone = useToggleDone()

  if (task === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <ScreenLoading />
      </View>
    )
  }

  const done = task.status === 'done'
  const due = task.hardDeadline ?? task.softDeadline
  const dueDate = due === null ? null : new Date(due)
  const overdue = !done && dueDate != null && daysFromToday(dueDate) < 0
  const priority = task.priority ?? null
  const others = task.assignees.filter((a) => a.userId !== task.viewerId)
  const iconColor = palette.ink3

  const complete = () => {
    Haptics.notificationAsync(
      done
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
    )
    toggleDone({ id: task._id, done }).catch(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
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
        {done ? (
          <View
            style={[styles.statusChip, { backgroundColor: palette.chipBg }]}
          >
            <AppText variant="meta" color={palette.ink2}>
              Completed
            </AppText>
          </View>
        ) : overdue ? (
          <View
            style={[
              styles.statusChip,
              { backgroundColor: palette.overdueSoft },
            ]}
          >
            <AppText variant="meta" color={palette.overdue}>
              Overdue
            </AppText>
          </View>
        ) : task.status === 'in_progress' ? (
          <View
            style={[styles.statusChip, { backgroundColor: palette.accentSoft }]}
          >
            <AppText variant="meta" color={palette.accentInk}>
              In progress
            </AppText>
          </View>
        ) : null}
      </View>

      <Card>
        {dueDate != null && (
          <MetaRow
            icon={<Calendar size={17} color={iconColor} />}
            label="Due"
            value={formatDateLong(dueDate)}
            valueColor={overdue ? palette.overdue : undefined}
          />
        )}
        {priority && (
          <MetaRow
            divider={dueDate != null}
            icon={<Flag size={17} color={priorityColors[priority]} />}
            label="Priority"
            value={priority[0].toUpperCase() + priority.slice(1)}
          />
        )}
        {task.goal && (
          <MetaRow
            divider={dueDate != null || priority != null}
            icon={<Target size={17} color={iconColor} />}
            label="Goal"
            value={task.goal.title}
          />
        )}
        {others.length > 0 && (
          <MetaRow
            divider
            icon={<Users size={17} color={iconColor} />}
            label="Shared with"
            value={others
              .map((a) => a.name.split(/\s+/)[0] || a.email)
              .join(', ')}
          />
        )}
        {!task.viewerIsCreator && (
          <MetaRow
            divider
            icon={<Bot size={17} color={iconColor} />}
            label="Assigned to you"
            value="by the task's creator"
          />
        )}
      </Card>

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

      <AccentButton
        label={done ? 'Mark as not done' : 'Mark as done'}
        onPress={complete}
      />
    </ScrollView>
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
  emoji: {
    fontSize: 40,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
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
