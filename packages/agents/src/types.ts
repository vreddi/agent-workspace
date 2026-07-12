import type { Direction, GridPosition } from '@worldkit/grid'

export type AgentId = string

export type AgentState = 'idle' | 'moving' | 'acting' | 'speaking' | 'waiting'

export type { Direction }

export type Agent = {
  id: AgentId
  name: string
  position: GridPosition
  facing: Direction
  state: AgentState
  data?: Record<string, unknown>
  traits?: Record<string, unknown>
  memory?: Record<string, unknown>
}
