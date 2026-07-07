import { space } from '@org/theme'
import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Screen, ScreenHeader, ScreenLoading } from '@/components/screen'
import { TaskRow } from '@/components/task-row'
import { AppText, Card, Chip } from '@/components/ui'
import { useTaskList } from '@/data/hooks'
import { daysFromToday } from '@/lib/dates'
import { useTheme } from '@/theme/theme-context'

const FILTERS = ['All', 'Open', 'Overdue', 'Done'] as const
type Filter = (typeof FILTERS)[number]

export default function TasksScreen() {
  const { palette } = useTheme()
  const tasks = useTaskList()
  const [filter, setFilter] = useState<Filter>('Open')

  const visible = useMemo(() => {
    const all = tasks ?? []
    switch (filter) {
      case 'Open':
        return all.filter((t) => t.status === 'open' || t.status === 'in_progress')
      case 'Overdue':
        return all.filter(
          (t) => !t.done && t.status !== 'cancelled' && t.due != null && daysFromToday(t.due) < 0,
        )
      case 'Done':
        return all.filter((t) => t.done)
      default:
        return all
    }
  }, [tasks, filter])

  return (
    <Screen>
      <ScreenHeader title="Tasks" meta={tasks === undefined ? undefined : `${visible.length}`} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.sm }}
      >
        {FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      {tasks === undefined ? (
        <ScreenLoading />
      ) : visible.length > 0 ? (
        <Card>
          {visible.map((task, i) => (
            <TaskRow key={task.id} task={task} showDivider={i > 0} />
          ))}
        </Card>
      ) : (
        <Card style={{ padding: space.xl }}>
          <AppText variant="label" color={palette.ink3}>
            No {filter.toLowerCase()} tasks.
          </AppText>
        </Card>
      )}

      <View style={{ paddingHorizontal: space.sm }}>
        <AppText variant="meta" color={palette.ink3}>
          Synced live with your Agent Workspace account.
        </AppText>
      </View>
    </Screen>
  )
}
