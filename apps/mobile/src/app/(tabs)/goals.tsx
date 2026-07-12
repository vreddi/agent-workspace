import type { GoalListItem } from '@convex/goals'
import { formatDue } from '@org/app-core'
import { radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { GoalTypeIcon } from '@/components/goal-type-icon'
import { RemindersBanner } from '@/components/reminders-banner'
import { Screen, ScreenLoading } from '@/components/screen'
import { AppText, Card, Chip } from '@/components/ui'
import { useGoalsByStatus, type GoalStatus } from '@/data/goals-data'
import { useTheme } from '@/theme/theme-context'

const STATUS_FILTERS: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'archived', label: 'Archived' },
]

const EMPTY_COPY: Record<GoalStatus, string> = {
  active: 'No active goals yet. Tap + to set one and start stacking wins.',
  achieved: 'Nothing here yet — achieved goals will show up as trophies.',
  archived: 'No archived goals. Set-aside goals land here.',
}

function GoalCard({ goal }: { goal: GoalListItem }) {
  const { palette } = useTheme()
  const total = goal.progress.totalTasks
  const done = goal.progress.completeTasks
  const progress = total === 0 ? 0 : done / total

  return (
    <Pressable onPress={() => router.push(`/goal/${goal._id}`)}>
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
              <AppText variant="heading" numberOfLines={1}>
                {goal.title}
              </AppText>
              <AppText variant="meta" color={palette.ink3}>
                {total === 0 ? 'No tasks yet' : `${done} of ${total} tasks`}
                {' · target '}
                {formatDue(new Date(goal.deadline))}
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
  const [status, setStatus] = useState<GoalStatus>('active')
  const goals = useGoalsByStatus(status)

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Goals</AppText>
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            router.push('/goal/new')
          }}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
          ]}
          hitSlop={8}
        >
          <Plus size={20} color="#ffffff" strokeWidth={2.5} />
        </Pressable>
      </View>

      <RemindersBanner />

      <View style={styles.filters}>
        {STATUS_FILTERS.map((filter) => (
          <Chip
            key={filter.value}
            label={filter.label}
            selected={filter.value === status}
            onPress={() => setStatus(filter.value)}
          />
        ))}
      </View>

      {goals === undefined ? (
        <ScreenLoading />
      ) : goals.length > 0 ? (
        goals.map((goal) => <GoalCard key={goal._id} goal={goal} />)
      ) : (
        <Card style={{ padding: space.xl }}>
          <AppText variant="label" color={palette.ink3}>
            {EMPTY_COPY[status]}
          </AppText>
        </Card>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.sm,
    paddingTop: space.sm,
    paddingBottom: space.xs,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.sm,
  },
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
