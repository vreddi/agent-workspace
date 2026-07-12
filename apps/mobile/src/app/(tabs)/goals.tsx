import { radius, space } from '@org/theme'
import { router } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { GoalTypeIcon } from '@/components/goal-type-icon'
import { Screen, ScreenHeader, ScreenLoading } from '@/components/screen'
import { AppText, Card } from '@/components/ui'
import { useGoalList, type Goal } from '@/data/hooks'
import { formatDue } from '@/lib/dates'
import { useTheme } from '@/theme/theme-context'

function GoalCard({ goal }: { goal: Goal }) {
  const { palette } = useTheme()
  const progress = goal.totalTasks === 0 ? 0 : goal.doneTasks / goal.totalTasks

  return (
    <Pressable onPress={() => router.push(`/goal/${goal.id}`)}>
      {({ pressed }) => (
        <Card
          style={[styles.card, pressed && { backgroundColor: palette.hover }]}
        >
          <View style={styles.head}>
            <GoalTypeIcon
              name={goal.type?.name ?? goal.title}
              color={goal.type?.color ?? 'slate'}
              icon={goal.type?.icon ?? null}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <AppText variant="heading">{goal.title}</AppText>
              <AppText variant="meta" color={palette.ink3}>
                {goal.totalTasks === 0
                  ? 'No tasks yet'
                  : `${goal.doneTasks} of ${goal.totalTasks} tasks`}
                {' · target '}
                {formatDue(goal.deadline)}
              </AppText>
            </View>
            <AppText variant="heading" color={palette.accentInk}>
              {Math.round(progress * 100)}%
            </AppText>
          </View>
          <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
            <View
              style={[
                styles.fill,
                {
                  backgroundColor: palette.accent,
                  width: `${Math.round(progress * 100)}%`,
                },
              ]}
            />
          </View>
        </Card>
      )}
    </Pressable>
  )
}

export default function GoalsScreen() {
  const { palette } = useTheme()
  const goals = useGoalList()

  return (
    <Screen>
      <ScreenHeader
        title="Goals"
        meta={goals === undefined ? undefined : `${goals.length}`}
      />
      {goals === undefined ? (
        <ScreenLoading />
      ) : goals.length > 0 ? (
        goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
      ) : (
        <Card style={{ padding: space.xl }}>
          <AppText variant="label" color={palette.ink3}>
            No active goals. Create one in the web app and it will show up here.
          </AppText>
        </Card>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: space.xl,
    gap: space.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
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
})
