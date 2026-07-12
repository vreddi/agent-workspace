/**
 * Shared create/edit form for goals, used by both goal/new and goal/edit.
 * Holds the editable field state; the parent decides what to do with the
 * assembled values on submit (create vs partial-diff update).
 *
 * The type picker is fed live from goalTypes.list and includes a "New type…"
 * option that opens an inline create sheet (goalTypes.create) and selects the
 * freshly made custom type on success.
 */
import { GOAL_TYPE_COLOR_TOKENS } from '@org/app-core'
import { radius, space } from '@org/theme'
import * as Haptics from 'expo-haptics'
import { useMemo, useState } from 'react'
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native'
import {
  DateFieldRow,
  FooterButton,
  FormScreen,
  FormSection,
  MultilineFieldRow,
  SelectRow,
  StepperRow,
  TextFieldRow,
  type SelectOption,
} from '@/components/forms'
import { goalTypeColorHex } from '@/components/goal-type-icon'
import { AppText } from '@/components/ui'
import { useCreateGoalType, useGoalTypes } from '@/data/goals-data'
import { useTheme } from '@/theme/theme-context'

/** Encoded type value: '' none · 'sys:<slug>' · 'custom:<id>'. */
export interface GoalFormValues {
  title: string
  description: string
  deadline: Date | null
  typeValue: string
  reminderDaysBefore: number
}

const NEW_TYPE = '__new__'

export function GoalForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: GoalFormValues
  submitLabel: string
  onSubmit: (values: GoalFormValues) => Promise<void>
}) {
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [deadline, setDeadline] = useState<Date | null>(initial.deadline)
  const [typeValue, setTypeValue] = useState(initial.typeValue)
  const [reminderDays, setReminderDays] = useState(initial.reminderDaysBefore)
  const [saving, setSaving] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const types = useGoalTypes()

  const tomorrow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const typeOptions: SelectOption<string>[] = useMemo(() => {
    const opts: SelectOption<string>[] = [{ label: 'No type', value: '' }]
    if (types) {
      for (const t of types.system) {
        opts.push({ label: t.name, value: `sys:${t.slug}`, color: goalTypeColorHex(t.color) })
      }
      for (const t of types.custom) {
        opts.push({ label: t.name, value: `custom:${t._id}`, color: goalTypeColorHex(t.color) })
      }
    }
    opts.push({ label: '+ New type…', value: NEW_TYPE })
    return opts
  }, [types])

  // The picker's minimumDate already blocks past dates, so a set deadline is
  // always in the future; the server re-validates as a backstop.
  const titleValid = title.trim().length > 0
  const deadlineValid = deadline != null
  const canSubmit = titleValid && deadlineValid && !saving

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      await onSubmit({ title, description, deadline, typeValue, reminderDaysBefore: reminderDays })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Could not save', errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

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
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Run a marathon"
          autoCapitalize="sentences"
        />
        <MultilineFieldRow
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="What does success look like?"
        />
      </FormSection>

      <FormSection label="Details">
        <DateFieldRow
          label="Target date"
          value={deadline}
          onChange={setDeadline}
          minimumDate={tomorrow}
          placeholder="Pick a date"
        />
        <SelectRow
          label="Type"
          value={typeValue}
          options={typeOptions}
          onChange={(next) => {
            if (next === NEW_TYPE) {
              setCreateOpen(true)
              return
            }
            setTypeValue(next)
          }}
          placeholder="No type"
        />
        <StepperRow
          label="Remind me"
          value={reminderDays}
          onChange={setReminderDays}
          min={1}
          max={90}
          unit={reminderDays === 1 ? 'day before' : 'days before'}
        />
      </FormSection>

      <NewTypeSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setTypeValue(`custom:${id}`)
          setCreateOpen(false)
        }}
      />
    </FormScreen>
  )
}

function NewTypeSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const { palette } = useTheme()
  const createType = useCreateGoalType()
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(GOAL_TYPE_COLOR_TOKENS[0])
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setName('')
    setColor(GOAL_TYPE_COLOR_TOKENS[0])
  }

  const create = async () => {
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    try {
      const id = await createType({ name: trimmed, color })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onCreated(id as unknown as string)
      reset()
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Could not create type', errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.divider }]}
          onPress={() => {}}
        >
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandle, { backgroundColor: palette.ink4 }]} />
          </View>
          <AppText variant="heading" style={styles.sheetTitle}>
            New goal type
          </AppText>
          <TextInput
            style={[
              styles.nameInput,
              { color: palette.ink1, backgroundColor: palette.chipBg, borderColor: palette.divider },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="Type name"
            placeholderTextColor={palette.ink3}
            autoFocus
            autoCapitalize="words"
          />
          <View style={styles.swatchRow}>
            {GOAL_TYPE_COLOR_TOKENS.map((token) => {
              const hex = goalTypeColorHex(token)
              const active = token === color
              return (
                <Pressable
                  key={token}
                  onPress={() => setColor(token)}
                  style={[
                    styles.swatch,
                    { backgroundColor: hex, borderColor: active ? palette.ink1 : 'transparent' },
                  ]}
                />
              )
            })}
          </View>
          <FooterButton
            label="Create type"
            onPress={create}
            disabled={name.trim().length === 0 || busy}
            loading={busy}
          />
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data
    if (typeof data === 'string') return data
  }
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.'
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: radius.pill,
  },
  sheetTitle: {
    paddingHorizontal: space.xs,
  },
  nameInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.md,
    fontSize: 15,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
    paddingVertical: space.xs,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
})
