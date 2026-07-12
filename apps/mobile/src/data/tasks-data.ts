/**
 * Task-management data layer for the mobile app: create / update / delete /
 * assignee mutations plus the detail, history, goal-picker and user-search
 * queries the task screens need. Mirrors the web app's use of the shared
 * Convex backend; every query returns `undefined` while its subscription
 * loads.
 */
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import type { TaskDetail, TaskHistoryEvent } from '@convex/tasks'
import type { UserSearchResult } from '@convex/users'
import { useMutation, useQuery } from 'convex/react'
import type { TaskPriority, TaskStatus } from '@/data/hooks'

export type { TaskDetail, TaskHistoryEvent, UserSearchResult }

// ── Enum option tables (shared by the chip pickers) ────────────────────────

export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export const DIFFICULTY_WORDS: Record<number, string> = {
  1: 'Very easy',
  2: 'Easy',
  3: 'Moderate',
  4: 'Hard',
  5: 'Challenging',
}

// ── Mutation payload shapes ────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string
  description?: string
  emoji?: string | null
  softDeadline?: number | null
  hardDeadline?: number | null
  estimateMinutes?: number | null
  priority?: TaskPriority | null
  difficulty?: number | null
  scheduledStartMinutes?: number | null
  goalId?: Id<'goals'> | null
  costDays?: number | null
}

export interface UpdateTaskPatch {
  id: Id<'tasks'>
  title?: string
  description?: string | null
  emoji?: string | null
  status?: TaskStatus
  softDeadline?: number | null
  hardDeadline?: number | null
  estimateMinutes?: number | null
  priority?: TaskPriority | null
  difficulty?: number | null
  scheduledStartMinutes?: number | null
  goalId?: Id<'goals'> | null
  costDays?: number | null
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function useCreateTask(): (
  input: CreateTaskInput,
) => Promise<Id<'tasks'>> {
  const create = useMutation(api.tasks.create)
  return (input) => create(input)
}

export function useUpdateTask(): (patch: UpdateTaskPatch) => Promise<unknown> {
  const update = useMutation(api.tasks.update)
  return (patch) => update(patch)
}

export function useRemoveTask(): (id: Id<'tasks'>) => Promise<unknown> {
  const remove = useMutation(api.tasks.remove)
  return (id) => remove({ id })
}

export function useSetAssignees(): (
  taskId: Id<'tasks'>,
  assigneeIds: Id<'users'>[],
) => Promise<unknown> {
  const set = useMutation(api.taskAssignments.setAssignees)
  return (taskId, assigneeIds) => set({ taskId, assigneeIds })
}

// ── Queries ────────────────────────────────────────────────────────────────

export function useTaskDetail(
  id: Id<'tasks'> | undefined,
): TaskDetail | undefined {
  return useQuery(api.tasks.get, id ? { id } : 'skip')
}

export function useTaskHistory(
  taskId: Id<'tasks'> | undefined,
): TaskHistoryEvent[] | undefined {
  return useQuery(api.tasks.history, taskId ? { taskId } : 'skip')
}

export interface GoalOption {
  id: Id<'goals'>
  title: string
}

/** Active goals for the goal-link picker. */
export function useGoalOptions(): GoalOption[] | undefined {
  const goals = useQuery(api.goals.list, { status: 'active' })
  return goals?.map((g) => ({ id: g._id, title: g.title }))
}

/** Directory search for the assignee picker; empty query stays idle. */
export function useUserSearch(query: string): UserSearchResult[] | undefined {
  const term = query.trim()
  return useQuery(api.users.search, term === '' ? 'skip' : { query: term })
}
