import type { Id } from '@convex/_generated/dataModel'
import { goalTypeValue, parseTypeValue } from '@org/app-core'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { GoalForm, type GoalFormValues } from '@/components/goal-form'
import { ScreenLoading } from '@/components/screen'
import { AppText } from '@/components/ui'
import { useGoalRaw, useUpdateGoal } from '@/data/goals-data'
import { modalScreenOptions } from '@/lib/navigation'
import { useTheme } from '@/theme/theme-context'

/** goals.get throws for a deleted/foreign id — show this instead of crashing. */
export function ErrorBoundary() {
  const { palette } = useTheme()
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 24,
      }}
    >
      <AppText variant="heading">Goal not found</AppText>
      <AppText variant="label" color={palette.ink3}>
        It may have been deleted.
      </AppText>
    </View>
  )
}

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { palette } = useTheme()
  const goalId = id as Id<'goals'> | undefined
  const goal = useGoalRaw(goalId)
  const updateGoal = useUpdateGoal()

  const submit = async (values: GoalFormValues) => {
    if (!goal) return
    const patch: Record<string, unknown> = {}
    if (values.title.trim() !== goal.title) patch.title = values.title
    const nextDescription = values.description.trim() || null
    if (nextDescription !== goal.description)
      patch.description = nextDescription
    const nextDeadline = values.deadline!.getTime()
    if (nextDeadline !== goal.deadline) patch.deadline = nextDeadline
    if (values.reminderDaysBefore !== goal.reminderDaysBefore) {
      patch.reminderDaysBefore = values.reminderDaysBefore
    }
    const currentType = goalTypeValue({
      typeSlug: goal.typeSlug,
      customTypeId: goal.customTypeId,
    })
    if (values.typeValue !== currentType) {
      const type = parseTypeValue<Id<'goalTypes'>>(values.typeValue)
      patch.typeSlug = type.kind === 'system' ? type.slug : null
      patch.customTypeId = type.kind === 'custom' ? type.id : null
    }
    if (Object.keys(patch).length > 0) {
      await updateGoal({ id: goal._id, ...patch })
    }
    router.back()
  }

  return (
    <>
      <Stack.Screen options={modalScreenOptions('Edit goal')} />
      {goal === undefined ? (
        <View style={{ flex: 1, backgroundColor: palette.bg }}>
          <ScreenLoading />
        </View>
      ) : (
        <GoalForm
          initial={{
            title: goal.title,
            description: goal.description ?? '',
            deadline: new Date(goal.deadline),
            typeValue: goalTypeValue({
              typeSlug: goal.typeSlug,
              customTypeId: goal.customTypeId,
            }),
            reminderDaysBefore: goal.reminderDaysBefore,
          }}
          submitLabel="Save changes"
          onSubmit={submit}
        />
      )}
    </>
  )
}
