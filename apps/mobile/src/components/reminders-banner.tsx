/**
 * Unread goal-reminder inbox, shown atop the Goals tab. Mirrors the web
 * amber banner: tap a row to open its goal, dismiss a single reminder, or
 * mark them all read. Hidden entirely when there are no unread reminders.
 */
import { radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { X } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { goalTypeColorHex } from '@/components/goal-type-icon'
import { AppText } from '@/components/ui'
import {
  useMarkAllRemindersRead,
  useMarkReminderRead,
  useUnreadReminders,
  type Reminder,
} from '@/data/goals-data'
import { useTheme } from '@/theme/theme-context'

function reminderText(reminder: Reminder): string {
  if (reminder.kind === 'overdue') {
    const over = Math.max(1, -reminder.daysRemaining)
    return `overdue by ${over} day${over === 1 ? '' : 's'}`
  }
  if (reminder.daysRemaining <= 0) return 'due today'
  return `due in ${reminder.daysRemaining} day${reminder.daysRemaining === 1 ? '' : 's'}`
}

export function RemindersBanner() {
  const { palette } = useTheme()
  const reminders = useUnreadReminders()
  const markRead = useMarkReminderRead()
  const markAllRead = useMarkAllRemindersRead()

  if (reminders === undefined || reminders.length === 0) return null

  const amber = goalTypeColorHex('amber')

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: `${amber}14`, borderColor: `${amber}55` },
      ]}
    >
      <View style={styles.head}>
        <AppText variant="caption" color={amber}>
          Goal reminders
        </AppText>
        <Pressable
          hitSlop={8}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            void markAllRead({})
          }}
        >
          <AppText variant="meta" color={palette.ink2}>
            Mark all read
          </AppText>
        </Pressable>
      </View>
      <View style={styles.list}>
        {reminders.map((reminder) => (
          <View key={reminder._id} style={styles.row}>
            <Pressable
              style={styles.rowMain}
              onPress={() => router.push(`/goal/${reminder.goalId}`)}
            >
              <AppText variant="label" numberOfLines={1}>
                {reminder.goalTitle}
              </AppText>
              <AppText
                variant="meta"
                color={
                  reminder.kind === 'overdue' ? palette.overdue : palette.ink3
                }
              >
                {reminderText(reminder)}
              </AppText>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                void markRead({ id: reminder._id })
              }}
            >
              <X size={16} color={palette.ink3} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.lg,
    gap: space.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  list: {
    gap: space.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
})
