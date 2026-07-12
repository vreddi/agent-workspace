import type { Id } from '@convex/_generated/dataModel'
import { parseTypeValue } from '@org/app-core'
import { router, Stack } from 'expo-router'
import { GoalForm, type GoalFormValues } from '@/components/goal-form'
import { useCreateGoal } from '@/data/goals-data'
import { modalScreenOptions } from '@/lib/navigation'

const DEFAULT_REMINDER_DAYS = 7

export default function NewGoalScreen() {
  const createGoal = useCreateGoal()

  const submit = async (values: GoalFormValues) => {
    const type = parseTypeValue<Id<'goalTypes'>>(values.typeValue)
    await createGoal({
      title: values.title,
      description: values.description.trim() || undefined,
      deadline: values.deadline!.getTime(),
      typeSlug: type.kind === 'system' ? type.slug : undefined,
      customTypeId: type.kind === 'custom' ? type.id : undefined,
      reminderDaysBefore: values.reminderDaysBefore,
    })
    router.back()
  }

  return (
    <>
      <Stack.Screen options={modalScreenOptions('New goal')} />
      <GoalForm
        initial={{
          title: '',
          description: '',
          deadline: null,
          typeValue: '',
          reminderDaysBefore: DEFAULT_REMINDER_DAYS,
        }}
        submitLabel="Create goal"
        onSubmit={submit}
      />
    </>
  )
}
