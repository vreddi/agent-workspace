import type { GridPosition } from '@worldkit/grid';
import type { Agent, AgentId, AgentState, Direction } from './types.js';

export function createAgent(input: {
  id: AgentId;
  name: string;
  position: GridPosition;
  facing?: Direction;
  state?: AgentState;
  data?: Record<string, unknown>;
  traits?: Record<string, unknown>;
  memory?: Record<string, unknown>;
}): Agent {
  if (typeof input.id !== 'string' || input.id.length === 0) {
    throw new Error('agent id must be a non-empty string');
  }
  if (typeof input.name !== 'string' || input.name.length === 0) {
    throw new Error('agent name must be a non-empty string');
  }
  const agent: Agent = {
    id: input.id,
    name: input.name,
    position: {
      x: input.position.x,
      y: input.position.y,
      z: input.position.z,
    },
    facing: input.facing ?? 'south',
    state: input.state ?? 'idle',
  };
  if (input.data !== undefined) {
    agent.data = input.data;
  }
  if (input.traits !== undefined) {
    agent.traits = input.traits;
  }
  if (input.memory !== undefined) {
    agent.memory = input.memory;
  }
  return agent;
}

export function setAgentPosition(
  agent: Agent,
  position: GridPosition,
): Agent {
  return {
    ...agent,
    position: { x: position.x, y: position.y, z: position.z },
  };
}

export function setAgentFacing(agent: Agent, facing: Direction): Agent {
  return { ...agent, facing };
}

export function setAgentState(agent: Agent, state: AgentState): Agent {
  return { ...agent, state };
}

export function isAgentIdle(agent: Agent): boolean {
  return agent.state === 'idle';
}

export function getDirectionFromDelta(delta: {
  x: number;
  y: number;
}): Direction | undefined {
  if (delta.x === 0 && delta.y === 0) {
    return undefined;
  }
  if (Math.abs(delta.x) >= Math.abs(delta.y)) {
    return delta.x > 0 ? 'east' : 'west';
  }
  return delta.y > 0 ? 'south' : 'north';
}
