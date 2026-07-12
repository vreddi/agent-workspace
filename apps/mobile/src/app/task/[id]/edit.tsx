/**
 * Full task editor (modal). Prefills every field from the task detail, then on
 * save computes a partial diff and calls api.tasks.update once — mirroring the
 * web edit form. Scheduled start is a time-of-day; the goal can be linked or
 * unlinked here too.
 */
import type { Id } from '@convex/_generated/dataModel'
import { radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import {
  ChipRowGroup,
  DateFieldRow,
  FooterButton,
  FormScreen,
  FormSection,
  MultilineFieldRow,
  SelectRow,
  StepperRow,
  type SelectOption,
} from '@/components/forms'
import { ScreenLoading } from '@/components/screen'
import { AppText, Card } from '@/components/ui'
import type { TaskPriority, TaskStatus } from '@/data/hooks'
import {
  STATUS_OPTIONS,
  useGoalOptions,
  useTaskDetail,
  useUpdateTask,
  type TaskDetail,
  type UpdateTaskPatch,
} from '@/data/tasks-data'
import { Font } from '@/theme/fonts'
import { useTheme } from '@/theme/theme-context'

const NO_GOAL = '__none__'

const PRIORITY_CHIPS: { label: string; value: TaskPriority | 'none' }[] = [
  { label: 'None', value: 'none' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

const STATUS_CHIPS = STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))

function minutesToDate(minutes: number): Date {
  const d = new Date()
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
  return d
}

function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes()
}

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const task = useTaskDetail(id as Id<'tasks'> | undefined)
  const { palette } = useTheme()

  if (task === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <ScreenLoading />
      </View>
    )
  }
  return <EditForm task={task} />
}

function EditForm({ task }: { task: TaskDetail }) {
  const updateTask = useUpdateTask()
  const goalOptions = useGoalOptions()

  const [title, setTitle] = useState(task.title)
  const [emoji, setEmoji] = useState(task.emoji ?? '')
  const [description, setDescription] = useState(task.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [priority, setPriority] = useState<TaskPriority | 'none'>(task.priority ?? 'none')
  const [difficulty, setDifficulty] = useState(task.difficulty ?? 0)
  const [estimateMinutes, setEstimateMinutes] = useState(task.estimateMinutes ?? 0)
  const [costDays, setCostDays] = useState(task.costDays ?? 0)
  const [softDeadline, setSoftDeadline] = useState<Date | null>(
    task.softDeadline === null ? null : new Date(task.softDeadline),
  )
  const [hardDeadline, setHardDeadline] = useState<Date | null>(
    task.hardDeadline === null ? null : new Date(task.hardDeadline),
  )
  const [scheduledStart, setScheduledStart] = useState<Date | null>(
    task.scheduledStartMinutes == null ? null : minutesToDate(task.scheduledStartMinutes),
  )
  const [goalId, setGoalId] = useState<string>(task.goalId ?? NO_GOAL)
  const [saving, setSaving] = useState(false)

  // Keep the current goal selectable even if it's no longer "active".
  const goalSelectOptions: SelectOption<string>[] = [
    { label: 'No goal', value: NO_GOAL },
    ...(goalOptions ?? []).map((g) => ({ label: g.title, value: g.id as string })),
  ]
  if (task.goal && !goalSelectOptions.some((o) => o.value === task.goal!._id)) {
    goalSelectOptions.push({ label: task.goal.title, value: task.goal._id })
  }

  const { palette } = useTheme()
  const canSubmit = title.trim() !== '' && !saving

  const save = () => {
    if (!canSubmit) return
    const patch: UpdateTaskPatch = { id: task._id }

    const nextTitle = title.trim()
    if (nextTitle !== task.title) patch.title = nextTitle

    const nextDescription = description.trim() === '' ? null : description.trim()
    if (nextDescription !== (task.description ?? null)) patch.description = nextDescription

    const nextEmoji = emoji.trim() === '' ? null : emoji.trim()
    if (nextEmoji !== (task.emoji ?? null)) patch.emoji = nextEmoji

    if (status !== task.status) patch.status = status

    const nextPriority = priority === 'none' ? null : priority
    if (nextPriority !== (task.priority ?? null)) patch.priority = nextPriority

    const nextDifficulty = difficulty === 0 ? null : difficulty
    if (nextDifficulty !== (task.difficulty ?? null)) patch.difficulty = nextDifficulty

    const nextEstimate = estimateMinutes === 0 ? null : estimateMinutes
    if (nextEstimate !== (task.estimateMinutes ?? null)) patch.estimateMinutes = nextEstimate

    const nextCost = costDays === 0 ? null : costDays
    if (nextCost !== (task.costDays ?? null)) patch.costDays = nextCost

    const nextSoft = softDeadline ? softDeadline.getTime() : null
    if (nextSoft !== task.softDeadline) patch.softDeadline = nextSoft

    const nextHard = hardDeadline ? hardDeadline.getTime() : null
    if (nextHard !== task.hardDeadline) patch.hardDeadline = nextHard

    const nextScheduled = scheduledStart ? dateToMinutes(scheduledStart) : null
    if (nextScheduled !== (task.scheduledStartMinutes ?? null)) {
      patch.scheduledStartMinutes = nextScheduled
    }

    const nextGoalId = goalId === NO_GOAL ? null : (goalId as Id<'goals'>)
    if (nextGoalId !== (task.goalId ?? null)) patch.goalId = nextGoalId

    setSaving(true)
    updateTask(patch)
      .then(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        router.back()
      })
      .catch(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setSaving(false)
      })
  }

  return (
    <FormScreen
      footer={
        <FooterButton label="Save changes" onPress={save} disabled={!canSubmit} loading={saving} />
      }
    >
      <Card style={styles.titleCard}>
        <TextInput
          style={[styles.emojiInput, { color: palette.ink1, backgroundColor: palette.chipBg }]}
          value={emoji}
          onChangeText={(t) => setEmoji(Array.from(t).slice(-1).join(''))}
          placeholder="🎯"
          placeholderTextColor={palette.ink3}
          maxLength={4}
        />
        <TextInput
          style={[styles.titleInput, { color: palette.ink1 }]}
          value={title}
          onChangeText={setTitle}
          placeholder="What needs doing?"
          placeholderTextColor={palette.ink3}
        />
      </Card>

      <FormSection label="Status & priority">
        <ChipRowGroup label="Status" value={status} options={STATUS_CHIPS} onChange={setStatus} />
        <ChipRowGroup
          label="Priority"
          value={priority}
          options={PRIORITY_CHIPS}
          onChange={setPriority}
        />
        <StepperRow
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          step={1}
          min={0}
          max={5}
        />
      </FormSection>

      <FormSection label="Schedule">
        <DateFieldRow
          label="Target date"
          mode="datetime"
          value={softDeadline}
          onChange={setSoftDeadline}
        />
        <DateFieldRow
          label="Hard deadline"
          mode="datetime"
          value={hardDeadline}
          onChange={setHardDeadline}
        />
        <DateFieldRow
          label="Start time"
          mode="datetime"
          value={scheduledStart}
          onChange={setScheduledStart}
        />
        <StepperRow
          label="Estimate"
          value={estimateMinutes}
          onChange={setEstimateMinutes}
          step={15}
          min={0}
          unit="min"
        />
      </FormSection>

      <FormSection label="Details">
        <MultilineFieldRow
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Anything worth remembering (optional)"
        />
        <SelectRow label="Goal" value={goalId} options={goalSelectOptions} onChange={setGoalId} />
        <StepperRow
          label="Cost"
          value={costDays}
          onChange={setCostDays}
          step={0.5}
          min={0}
          unit="days"
        />
      </FormSection>

      <AppText variant="meta" color={palette.ink3} style={styles.note}>
        Start time uses only the time of day. Estimate and cost of 0 clear the field.
      </AppText>
    </FormScreen>
  )
}

const styles = StyleSheet.create({
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
  },
  emojiInput: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 22,
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: Font.bold,
  },
  note: {
    paddingHorizontal: space.md,
  },
})
