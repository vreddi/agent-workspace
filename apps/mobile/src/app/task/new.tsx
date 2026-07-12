/**
 * Quick-capture modal for a new task. Title is front-and-centre with an emoji
 * glyph; priority, a soft deadline, and an optional goal link sit below, and an
 * "Add details" disclosure reveals the fuller planning fields. Accepts an
 * optional ?goalId= param to prefill the goal (the goals screen links here).
 */
import type { Id } from '@convex/_generated/dataModel'
import { priority as priorityColors, radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
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
import { AppText, Card } from '@/components/ui'
import type { TaskPriority } from '@/data/hooks'
import { useCreateTask, useGoalOptions } from '@/data/tasks-data'
import { Font } from '@/theme/fonts'
import { useTheme } from '@/theme/theme-context'

const NO_GOAL = '__none__'

const PRIORITY_CHIPS: { label: string; value: TaskPriority | 'none' }[] = [
  { label: 'None', value: 'none' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

export default function NewTaskScreen() {
  const { palette } = useTheme()
  const params = useLocalSearchParams<{ goalId?: string }>()
  const createTask = useCreateTask()
  const goalOptions = useGoalOptions()

  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('')
  const [priority, setPriority] = useState<TaskPriority | 'none'>('none')
  const [softDeadline, setSoftDeadline] = useState<Date | null>(null)
  const [goalId, setGoalId] = useState<string>(params.goalId ?? NO_GOAL)

  const [showDetails, setShowDetails] = useState(false)
  const [description, setDescription] = useState('')
  const [hardDeadline, setHardDeadline] = useState<Date | null>(null)
  const [estimateMinutes, setEstimateMinutes] = useState(0)
  const [costDays, setCostDays] = useState(0)

  const [saving, setSaving] = useState(false)

  const goalSelectOptions: SelectOption<string>[] = [
    { label: 'No goal', value: NO_GOAL },
    ...(goalOptions ?? []).map((g) => ({ label: g.title, value: g.id as string })),
  ]

  const canSubmit = title.trim() !== '' && !saving

  const submit = () => {
    if (!canSubmit) return
    setSaving(true)
    createTask({
      title: title.trim(),
      emoji: emoji.trim() || null,
      priority: priority === 'none' ? null : priority,
      softDeadline: softDeadline ? softDeadline.getTime() : null,
      hardDeadline: hardDeadline ? hardDeadline.getTime() : null,
      description: description.trim() || undefined,
      estimateMinutes: estimateMinutes > 0 ? estimateMinutes : null,
      costDays: costDays > 0 ? costDays : null,
      goalId: goalId === NO_GOAL ? null : (goalId as Id<'goals'>),
    })
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
        <FooterButton label="Add task" onPress={submit} disabled={!canSubmit} loading={saving} />
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
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </Card>

      <FormSection>
        <ChipRowGroup
          label="Priority"
          value={priority}
          options={PRIORITY_CHIPS}
          onChange={setPriority}
        />
        <DateFieldRow
          label="Target date"
          mode="datetime"
          value={softDeadline}
          onChange={setSoftDeadline}
        />
        <SelectRow
          label="Goal"
          value={goalId}
          options={goalSelectOptions}
          onChange={setGoalId}
        />
      </FormSection>

      <Pressable
        onPress={() => setShowDetails((v) => !v)}
        style={({ pressed }) => [
          styles.disclosure,
          { backgroundColor: pressed ? palette.hover : 'transparent' },
        ]}
      >
        <AppText variant="label" color={palette.accent}>
          {showDetails ? 'Hide details' : 'Add details'}
        </AppText>
        {showDetails ? (
          <ChevronUp size={16} color={palette.accent} />
        ) : (
          <ChevronDown size={16} color={palette.accent} />
        )}
      </Pressable>

      {showDetails ? (
        <FormSection>
          <MultilineFieldRow
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Anything worth remembering (optional)"
          />
          <DateFieldRow
            label="Hard deadline"
            mode="datetime"
            value={hardDeadline}
            onChange={setHardDeadline}
          />
          <StepperRow
            label="Estimate"
            value={estimateMinutes}
            onChange={setEstimateMinutes}
            step={15}
            min={0}
            unit="min"
          />
          <StepperRow
            label="Cost"
            value={costDays}
            onChange={setCostDays}
            step={0.5}
            min={0}
            unit="days"
          />
        </FormSection>
      ) : null}

      {priority !== 'none' ? (
        <View style={styles.hintRow}>
          <View style={[styles.dot, { backgroundColor: priorityColors[priority] }]} />
          <AppText variant="meta" color={palette.ink3}>
            {PRIORITY_CHIPS.find((p) => p.value === priority)?.label} priority
          </AppText>
        </View>
      ) : null}
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
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
})
