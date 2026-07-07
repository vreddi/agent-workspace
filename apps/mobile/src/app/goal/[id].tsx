import type { Id } from '@convex/_generated/dataModel'
import { radius, space } from '@org/theme'
import { useLocalSearchParams } from 'expo-router'
import { ScrollView, StyleSheet, View } from 'react-native'
import { GoalTypeIcon } from '@/components/goal-type-icon'
import { ScreenLoading } from '@/components/screen'
import { TaskRow } from '@/components/task-row'
import { AppText, Card, SectionLabel } from '@/components/ui'
import { useGoalBoard, useGoalDetail, type Task } from '@/data/hooks'
import { formatDateLong } from '@/lib/dates'
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

function BoardSection({ label, tasks }: { label: string; tasks: Task[] }) {
  if (tasks.length === 0) return null
  return (
    <View>
      <SectionLabel>{label}</SectionLabel>
      <Card>
        {tasks.map((task, i) => (
          <TaskRow key={task.id} task={task} showDivider={i > 0} />
        ))}
      </Card>
    </View>
  )
}

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { palette } = useTheme()
  const goalId = id as Id<'goals'> | undefined
  const goal = useGoalDetail(goalId)
  const board = useGoalBoard(goalId)

  if (goal === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <ScreenLoading />
      </View>
    )
  }

  const progress = goal.totalTasks === 0 ? 0 : goal.doneTasks / goal.totalTasks

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
          <AppText variant="meta" color={palette.ink3}>
            target {formatDateLong(goal.deadline)}
          </AppText>
        </View>
      </View>

      <Card style={styles.progressCard}>
        <View style={styles.progressHead}>
          <AppText variant="label" color={palette.ink2}>
            {goal.totalTasks === 0
              ? 'No tasks yet — add some in the web app'
              : `${goal.doneTasks} of ${goal.totalTasks} tasks done`}
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
      </Card>

      {goal.description ? (
        <Card style={styles.notes}>
          <AppText variant="caption">About</AppText>
          <AppText variant="label" color={palette.ink2} style={styles.notesBody}>
            {goal.description}
          </AppText>
        </Card>
      ) : null}

      {board === undefined ? (
        <ScreenLoading />
      ) : (
        <>
          <BoardSection label="In progress" tasks={board.inProgress} />
          <BoardSection label="To do" tasks={board.todo} />
          <BoardSection label="Done" tasks={board.done} />
        </>
      )}
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
