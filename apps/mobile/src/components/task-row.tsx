import { priority as priorityColors, radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { AppText } from '@/components/ui'
import { useToggleDone, type Task } from '@/data/hooks'
import { daysFromToday, formatDue } from '@org/app-core'
import { useTheme } from '@/theme/theme-context'

/**
 * One task in a list: complete toggle, emoji, title, due label. Mirrors the
 * web `.t-task-row`. Tapping the row pushes the detail screen; tapping the
 * ring toggles completion (live Convex mutation) with a haptic tick.
 */
export function TaskRow({
  task,
  showDivider,
}: {
  task: Task
  showDivider: boolean
}) {
  const { palette } = useTheme()
  const toggleDone = useToggleDone()
  const overdue = !task.done && task.due != null && daysFromToday(task.due) < 0

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    toggleDone(task).catch(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    })
  }

  return (
    <Pressable
      onPress={() => router.push(`/task/${task.id}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? palette.hover : 'transparent' },
        showDivider && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: palette.divider,
        },
      ]}
    >
      <Pressable onPress={toggle} hitSlop={10} style={styles.dotHit}>
        <View
          style={[
            styles.dot,
            task.done
              ? { backgroundColor: palette.ink4, borderColor: palette.ink4 }
              : overdue
                ? {
                    borderColor: palette.overdue,
                    backgroundColor: palette.overdueSoft,
                  }
                : {
                    borderColor: task.priority
                      ? priorityColors[task.priority]
                      : palette.ink4,
                  },
          ]}
        />
      </Pressable>
      <AppText style={styles.emoji}>{task.emoji ?? '•'}</AppText>
      <AppText
        variant="body"
        numberOfLines={1}
        color={task.done ? palette.ink3 : palette.ink1}
        style={[styles.title, task.done && styles.titleDone]}
      >
        {task.title}
      </AppText>
      {task.due != null && !task.done ? (
        <AppText
          variant="meta"
          color={overdue ? palette.overdue : palette.ink3}
        >
          {formatDue(task.due)}
        </AppText>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
  },
  dotHit: {
    padding: 2,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  emoji: {
    width: 22,
    textAlign: 'center',
    fontSize: 15,
  },
  title: {
    flex: 1,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
})
