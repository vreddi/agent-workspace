import { radius, space } from '@org/theme'
import { router } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Screen, ScreenLoading } from '@/components/screen'
import { TaskRow } from '@/components/task-row'
import { AppText, BottomTabInset, Card, SectionLabel } from '@/components/ui'
import { useCurrentUser, useTaskList, type Task } from '@/data/hooks'
import { daysFromToday, formatDateLong, greetingForHour } from '@org/app-core'
import { useTheme } from '@/theme/theme-context'

function TaskCard({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      {tasks.map((task, i) => (
        <TaskRow key={task.id} task={task} showDivider={i > 0} />
      ))}
    </Card>
  )
}

export default function TodayScreen() {
  const { palette } = useTheme()
  const tasks = useTaskList()
  const user = useCurrentUser()
  const insets = useSafeAreaInsets()

  const now = new Date()
  const firstName = user?.name?.trim().split(/\s+/)[0]
  const greeting = firstName
    ? `${greetingForHour(now.getHours())}, ${firstName}`
    : greetingForHour(now.getHours())

  const open = (tasks ?? []).filter(
    (t) => (t.status === 'open' || t.status === 'in_progress') && t.due != null,
  )
  const overdue = open.filter((t) => daysFromToday(t.due!) < 0)
  const today = open.filter((t) => daysFromToday(t.due!) === 0)
  const doneToday = (tasks ?? []).filter(
    (t) => t.done && t.completedAt != null && daysFromToday(t.completedAt) === 0,
  )

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        <View style={styles.hello}>
          <AppText variant="hero">{greeting}</AppText>
          <View style={styles.meta}>
            <AppText variant="meta" color={palette.ink2}>
              {formatDateLong(now)}
            </AppText>
            <View style={[styles.dotTiny, { backgroundColor: palette.ink4 }]} />
            <AppText variant="meta" color={palette.ink2}>
              {today.length} due today
            </AppText>
            {overdue.length > 0 && (
              <>
                <View style={[styles.dotTiny, { backgroundColor: palette.ink4 }]} />
                <AppText variant="meta" color={palette.overdue}>
                  {overdue.length} overdue
                </AppText>
              </>
            )}
          </View>
        </View>

        {tasks === undefined ? (
          <ScreenLoading />
        ) : (
          <>
            {overdue.length > 0 && (
              <View>
                <SectionLabel>Overdue</SectionLabel>
                <TaskCard tasks={overdue} />
              </View>
            )}

            <View>
              <SectionLabel>Today</SectionLabel>
              {today.length > 0 ? (
                <TaskCard tasks={today} />
              ) : (
                <Card style={styles.empty}>
                  <AppText variant="label" color={palette.ink3}>
                    Nothing due today — enjoy the quiet, or pull something forward.
                  </AppText>
                </Card>
              )}
            </View>

            {doneToday.length > 0 && (
              <View>
                <SectionLabel>Done today</SectionLabel>
                <TaskCard tasks={doneToday} />
              </View>
            )}
          </>
        )}
      </Screen>

      <Pressable
        onPress={() => router.push('/task/new')}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: palette.accent,
            bottom: BottomTabInset + insets.bottom + space.md,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <Plus size={26} color="#ffffff" strokeWidth={2.5} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  hello: {
    paddingHorizontal: space.sm,
    paddingTop: space.xl,
    paddingBottom: space.xs,
    gap: 10,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  dotTiny: {
    width: 3,
    height: 3,
    borderRadius: radius.pill,
  },
  empty: {
    padding: space.xl,
  },
  fab: {
    position: 'absolute',
    right: space.xl,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.25)',
  },
})
