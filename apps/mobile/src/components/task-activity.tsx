/**
 * Activity log for a task detail screen: renders api.tasks.history events as
 * human-readable lines, mirroring the web app's phrasing.
 */
import type { Id } from '@convex/_generated/dataModel'
import { radius, space } from '@org/theme'
import { StyleSheet, View } from 'react-native'
import { AppText, Card, SectionLabel } from '@/components/ui'
import {
  fmtEventTime,
  parseValue,
  phraseForChange,
} from '@/components/task-format'
import { useTaskHistory, type TaskHistoryEvent } from '@/data/tasks-data'
import { useTheme } from '@/theme/theme-context'

function summarize(event: TaskHistoryEvent): {
  lead: string
  extras: string[]
} {
  if (event.kind === 'created') return { lead: 'created this task', extras: [] }
  if (event.kind === 'deleted') return { lead: 'deleted this task', extras: [] }
  const statusChange = event.changes.find((c) => c.field === 'status')
  const phrases = event.changes
    .map((c) => phraseForChange(c, parseValue(statusChange?.before ?? null)))
    .filter((p): p is string => p !== null)
  if (phrases.length === 0) return { lead: 'updated this task', extras: [] }
  if (phrases.length === 1) return { lead: phrases[0]!, extras: [] }
  return { lead: `made ${phrases.length} changes`, extras: phrases }
}

function ActivityItem({
  event,
  divider,
}: {
  event: TaskHistoryEvent
  divider: boolean
}) {
  const { palette } = useTheme()
  const actor = event.actorIsYou ? 'You' : event.actorName
  const { lead, extras } = summarize(event)
  const created = event.kind === 'created'

  return (
    <View
      style={[
        styles.item,
        divider && {
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: palette.divider,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: created ? palette.accent : palette.ink4 },
        ]}
      />
      <View style={styles.body}>
        <AppText variant="label" color={palette.ink1}>
          <AppText variant="label" color={palette.ink1}>
            {actor}
          </AppText>
          {` ${lead}`}
        </AppText>
        {extras.length > 0 ? (
          <View style={styles.extras}>
            {extras.map((phrase, i) => (
              <AppText key={i} variant="meta" color={palette.ink2}>
                • {phrase}
              </AppText>
            ))}
          </View>
        ) : null}
        <AppText variant="meta" color={palette.ink3}>
          {fmtEventTime(event._creationTime)}
        </AppText>
      </View>
    </View>
  )
}

export function TaskActivitySection({ taskId }: { taskId: Id<'tasks'> }) {
  const { palette } = useTheme()
  const events = useTaskHistory(taskId)

  return (
    <View>
      <SectionLabel>Activity</SectionLabel>
      {events === undefined ? (
        <Card style={styles.pad}>
          <AppText variant="label" color={palette.ink3}>
            Loading history…
          </AppText>
        </Card>
      ) : events.length === 0 ? (
        <Card style={styles.pad}>
          <AppText variant="label" color={palette.ink3}>
            Nothing has happened here yet.
          </AppText>
        </Card>
      ) : (
        <Card>
          {events.map((event, i) => (
            <ActivityItem key={event._id} event={event} divider={i > 0} />
          ))}
        </Card>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    marginTop: 6,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  extras: {
    gap: 2,
  },
  pad: {
    padding: space.xl,
  },
})
