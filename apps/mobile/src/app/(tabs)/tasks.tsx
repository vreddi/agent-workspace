import { radius, space } from '@org/theme'
import { router } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Screen, ScreenHeader, ScreenLoading } from '@/components/screen'
import { TaskRow } from '@/components/task-row'
import { AppText, Card, Chip } from '@/components/ui'
import { useTaskList } from '@/data/hooks'
import { daysFromToday } from '@org/app-core'
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
        return all.filter(
          (t) => t.status === 'open' || t.status === 'in_progress',
        )
      case 'Overdue':
        return all.filter(
          (t) =>
            !t.done &&
            t.status !== 'cancelled' &&
            t.due != null &&
            daysFromToday(t.due) < 0,
        )
      case 'Done':
        return all.filter((t) => t.done)
      default:
        return all
    }
  }, [tasks, filter])

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <ScreenHeader
            title="Tasks"
            meta={tasks === undefined ? undefined : `${visible.length}`}
          />
        </View>
        <Pressable
          onPress={() => router.push('/task/new')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: palette.accent, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Plus size={22} color="#ffffff" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.sm }}
      >
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
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

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingRight: space.sm,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
