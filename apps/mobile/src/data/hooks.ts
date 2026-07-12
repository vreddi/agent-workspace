/**
 * Live data hooks over the shared Convex backend — the same queries and
 * mutations the web app uses, mapped to compact view models for the mobile
 * screens. All hooks return `undefined` while the subscription loads.
 */
import { api } from '@convex/_generated/api'
import type { Doc, Id } from '@convex/_generated/dataModel'
import type { GoalListItem } from '@convex/goals'
import type { TaskListItem } from '@convex/tasks'
import { useMutation, useQuery } from 'convex/react'

export type TaskStatus = Doc<'tasks'>['status']
export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: Id<'tasks'>
  title: string
  emoji: string | null
  /** Display deadline: the hard deadline, else the soft target date. */
  due: Date | null
  priority: TaskPriority | null
  status: TaskStatus
  done: boolean
  completedAt: Date | null
}

export function toTask(doc: TaskListItem | Doc<'tasks'>): Task {
  const due = doc.hardDeadline ?? doc.softDeadline
  return {
    id: doc._id,
    title: doc.title,
    emoji: doc.emoji ?? null,
    due: due === null ? null : new Date(due),
    priority: doc.priority ?? null,
    status: doc.status,
    done: doc.status === 'done',
    completedAt: doc.completedAt === null ? null : new Date(doc.completedAt),
  }
}

export function useTaskList(): Task[] | undefined {
  const docs = useQuery(api.tasks.list, {})
  return docs?.map(toTask)
}

/** Flip a task between done and open, like the web row checkbox. */
export function useToggleDone(): (
  task: Pick<Task, 'id' | 'done'>,
) => Promise<unknown> {
  const update = useMutation(api.tasks.update)
  return (task) => update({ id: task.id, status: task.done ? 'open' : 'done' })
}

export interface GoalType {
  name: string
  /** Color token (tailwind name, e.g. 'emerald') — see GoalTypeIcon. */
  color: string
  /** Lucide icon name for system types; free-form for custom ones. */
  icon: string | null
}

export interface Goal {
  id: Id<'goals'>
  title: string
  description: string | null
  type: GoalType | null
  deadline: Date
  doneTasks: number
  totalTasks: number
}

export function toGoal(doc: GoalListItem): Goal {
  return {
    id: doc._id,
    title: doc.title,
    description: doc.description,
    type: doc.type
      ? { name: doc.type.name, color: doc.type.color, icon: doc.type.icon }
      : null,
    deadline: new Date(doc.deadline),
    doneTasks: doc.progress.completeTasks,
    totalTasks: doc.progress.totalTasks,
  }
}

export function useGoalList(): Goal[] | undefined {
  const docs = useQuery(api.goals.list, {})
  return docs?.map(toGoal)
}

export function useGoalDetail(id: Id<'goals'> | undefined): Goal | undefined {
  const doc = useQuery(api.goals.get, id ? { id } : 'skip')
  return doc ? toGoal(doc) : undefined
}

/** The goal's tasks bucketed by kanban stage, as mobile view models. */
export function useGoalBoard(
  id: Id<'goals'> | undefined,
): { todo: Task[]; inProgress: Task[]; done: Task[] } | undefined {
  const board = useQuery(api.goals.board, id ? { id } : 'skip')
  if (!board) return undefined
  return {
    todo: board.inactive.map(toTask),
    inProgress: board.active.map(toTask),
    done: board.complete.map(toTask),
  }
}

export interface Agent {
  id: Id<'agents'>
  name: string
  /** Model powering the agent — shown as the role chip. */
  model: string
  statusLine: string
  color: string
}

/** Stable avatar color per agent, from the shared brand-ish palette. */
const AGENT_COLORS = ['#18a86b', '#e8a13c', '#5b8df8', '#b06ee0', '#e2695f']

function agentColor(name: string): string {
  let hash = 0
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AGENT_COLORS[Math.abs(hash) % AGENT_COLORS.length]
}

export function toAgent(doc: Doc<'agents'>): Agent {
  return {
    id: doc._id,
    name: doc.name,
    model: doc.model,
    statusLine: doc.personality?.trim() || 'Wandering the village',
    color: agentColor(doc.name),
  }
}

export function useAgentList(): Agent[] | undefined {
  const docs = useQuery(api.agents.list, {})
  return docs?.map(toAgent)
}

/** The signed-in user's profile row from Convex (null until synced). */
export function useCurrentUser(): Doc<'users'> | null | undefined {
  return useQuery(api.users.current, {})
}

export function useTaskDetail(id: Id<'tasks'> | undefined) {
  return useQuery(api.tasks.get, id ? { id } : 'skip')
}
