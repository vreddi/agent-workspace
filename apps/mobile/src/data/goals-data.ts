/**
 * Live Convex data hooks for goal management on mobile — the write side that
 * brings the goals tab to parity with the web app: create/edit goals, custom
 * goal types, board stage moves, task attach/detach, status changes, delete,
 * and the reminders inbox. Read hooks return `undefined` while loading.
 *
 * These sit alongside src/data/hooks.ts (the compact read view-models); here
 * we keep the raw hydrated docs the create/edit/detail flows need (status,
 * reminderDaysBefore, encoded type, deadline in ms).
 */
import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import type { GoalListItem } from '@convex/goals'
import { useMutation, useQuery } from 'convex/react'
import { toTask, type Task } from '@/data/hooks'

export type GoalStatus = 'active' | 'achieved' | 'archived'
export type BoardStage = 'inactive' | 'active' | 'complete'

/**
 * Current epoch ms, read through a module boundary so live "time now"
 * derivations (countdowns, overdue labels) don't trip the react-compiler
 * purity lint the way a bare `Date.now()` in a component body would — the
 * same pattern the date helpers in src/lib use.
 */
export function nowMs(): number {
  return Date.now()
}

export type Reminder = Doc<'goalReminders'>
export type GoalTypeRow = Doc<'goalTypes'>

/** Full hydrated goals for a status filter (raw fields, not the list view-model). */
export function useGoalsByStatus(status: GoalStatus): GoalListItem[] | undefined {
  return useQuery(api.goals.list, { status })
}

/** One goal with its hydrated type + progress, or undefined while loading. */
export function useGoalRaw(id: Id<'goals'> | undefined): GoalListItem | undefined {
  return useQuery(api.goals.get, id ? { id } : 'skip')
}

/** The goal's tasks bucketed by kanban stage, as task view-models. */
export function useGoalStages(
  id: Id<'goals'> | undefined,
): Record<BoardStage, Task[]> | undefined {
  const board = useQuery(api.goals.board, id ? { id } : 'skip')
  if (!board) return undefined
  return {
    inactive: board.inactive.map(toTask),
    active: board.active.map(toTask),
    complete: board.complete.map(toTask),
  }
}

/** System + custom goal types for the type picker. */
export function useGoalTypes(): { system: readonly GoalTypeSystem[]; custom: GoalTypeRow[] } | undefined {
  return useQuery(api.goalTypes.list, {})
}

/** Shape of a built-in goal type returned by goalTypes.list. */
export interface GoalTypeSystem {
  slug: string
  name: string
  description: string
  color: string
  icon: string
  image?: string
}

/** A task that can be attached to a goal: open/in-progress and unattached. */
export interface AttachableTask {
  id: Id<'tasks'>
  title: string
  emoji: string | null
  status: Doc<'tasks'>['status']
}

export function useAttachableTasks(): AttachableTask[] | undefined {
  const docs = useQuery(api.tasks.list, {})
  if (!docs) return undefined
  return docs
    .filter((t) => t.goalId == null && (t.status === 'open' || t.status === 'in_progress'))
    .map((t) => ({ id: t._id, title: t.title, emoji: t.emoji ?? null, status: t.status }))
}

// --- Mutations -------------------------------------------------------------

export function useCreateGoal() {
  return useMutation(api.goals.create)
}

export function useUpdateGoal() {
  return useMutation(api.goals.update)
}

export function useSetGoalStatus() {
  return useMutation(api.goals.setStatus)
}

export function useRemoveGoal() {
  return useMutation(api.goals.remove)
}

export function useCreateGoalType() {
  return useMutation(api.goalTypes.create)
}

export function useAddTasksToGoal() {
  return useMutation(api.goals.addTasks)
}

export function useRemoveTaskFromGoal() {
  return useMutation(api.goals.removeTask)
}

export function useMoveTaskStage() {
  return useMutation(api.goals.moveTask)
}

// --- Reminders -------------------------------------------------------------

export function useUnreadReminders(): Reminder[] | undefined {
  return useQuery(api.goalReminders.listUnread, {})
}

export function useMarkReminderRead() {
  return useMutation(api.goalReminders.markRead)
}

export function useMarkAllRemindersRead() {
  return useMutation(api.goalReminders.markAllRead)
}
