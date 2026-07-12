/**
 * Create/edit form for a numeric metric, mirroring the web MetricDrawer:
 * name, unit, direction, optional start/target values, and a target date that
 * defaults to the goal deadline. Holds the editable field state; the parent
 * route decides create vs partial update on submit.
 */
import { space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Alert } from 'react-native'
import {
  ChipRowGroup,
  DateFieldRow,
  FooterButton,
  FormScreen,
  FormSection,
  TextFieldRow,
} from '@/components/forms'
import { AppText } from '@/components/ui'
import {
  isValidOptionalNumber,
  parseDecimal,
  type MetricDirection,
} from '@/data/metrics-data'
import { useTheme } from '@/theme/theme-context'

export interface MetricFormValues {
  name: string
  unit: string
  direction: MetricDirection
  /** Raw text; parsed on submit. Empty = unset. */
  startValue: string
  targetValue: string
  targetDate: Date | null
}

const DIRECTION_OPTIONS = [
  { label: 'Lower is better', value: 'decrease' as const },
  { label: 'Higher is better', value: 'increase' as const },
]

export function MetricForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: MetricFormValues
  submitLabel: string
  onSubmit: (values: MetricFormValues) => Promise<void>
}) {
  const { palette } = useTheme()
  const [name, setName] = useState(initial.name)
  const [unit, setUnit] = useState(initial.unit)
  const [direction, setDirection] = useState<MetricDirection>(initial.direction)
  const [startValue, setStartValue] = useState(initial.startValue)
  const [targetValue, setTargetValue] = useState(initial.targetValue)
  const [targetDate, setTargetDate] = useState<Date | null>(initial.targetDate)
  const [saving, setSaving] = useState(false)

  const nameValid = name.trim().length > 0
  const startValid = isValidOptionalNumber(startValue)
  const targetValid = isValidOptionalNumber(targetValue)
  const canSubmit = nameValid && startValid && targetValid && !saving

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      await onSubmit({ name, unit, direction, startValue, targetValue, targetDate })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Could not save metric', errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const hasTarget = parseDecimal(targetValue) !== null

  return (
    <FormScreen
      footer={
        <FooterButton
          label={submitLabel}
          onPress={submit}
          disabled={!canSubmit}
          loading={saving}
        />
      }
    >
      <FormSection>
        <TextFieldRow
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Body weight"
          autoCapitalize="sentences"
        />
        <TextFieldRow
          label="Unit"
          value={unit}
          onChangeText={setUnit}
          placeholder="lbs, pts, %"
          autoCapitalize="none"
        />
      </FormSection>

      <FormSection label="Direction">
        <ChipRowGroup
          value={direction}
          options={DIRECTION_OPTIONS}
          onChange={setDirection}
        />
      </FormSection>

      <FormSection label="Target">
        <TextFieldRow
          label="Starting value"
          value={startValue}
          onChangeText={setStartValue}
          placeholder="Optional"
          keyboardType="decimal-pad"
        />
        <TextFieldRow
          label="Target value"
          value={targetValue}
          onChangeText={setTargetValue}
          placeholder="Optional"
          keyboardType="decimal-pad"
        />
        <DateFieldRow
          label="Target date"
          value={hasTarget ? targetDate : null}
          onChange={setTargetDate}
          placeholder={hasTarget ? 'Pick a date' : 'Set a target first'}
        />
      </FormSection>

      <AppText variant="meta" color={palette.ink3} style={{ paddingHorizontal: space.sm }}>
        Log readings over time to watch the value trend toward your target. The
        target date only applies once a target value is set.
      </AppText>
    </FormScreen>
  )
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data
    if (typeof data === 'string') return data
  }
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}
