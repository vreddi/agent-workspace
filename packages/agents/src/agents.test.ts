import { describe, expect, it } from 'vitest';
import {
  createAgent,
  getDirectionFromDelta,
  isAgentIdle,
  setAgentFacing,
  setAgentPosition,
  setAgentState,
} from './agents.js';

const makeAgent = () =>
  createAgent({
    id: 'agent_1',
    name: 'Mira',
    position: { x: 2, y: 3, z: 0 },
  });

describe('createAgent', () => {
  it('creates an agent with default facing and state', () => {
    const agent = makeAgent();
    expect(agent).toEqual({
      id: 'agent_1',
      name: 'Mira',
      position: { x: 2, y: 3, z: 0 },
      facing: 'south',
      state: 'idle',
    });
  });

  it('accepts optional facing, state, data, traits, and memory', () => {
    const agent = createAgent({
      id: 'agent_1',
      name: 'Mira',
      position: { x: 0, y: 0, z: 1 },
      facing: 'east',
      state: 'moving',
      data: { skin: 'green' },
      traits: { curiosity: 0.8 },
      memory: { lastSpoke: 'hello' },
    });
    expect(agent.position).toEqual({ x: 0, y: 0, z: 1 });
    expect(agent.facing).toBe('east');
    expect(agent.state).toBe('moving');
    expect(agent.data).toEqual({ skin: 'green' });
    expect(agent.traits).toEqual({ curiosity: 0.8 });
    expect(agent.memory).toEqual({ lastSpoke: 'hello' });
  });

  it('omits optional fields when not provided', () => {
    const agent = makeAgent();
    expect('data' in agent).toBe(false);
    expect('traits' in agent).toBe(false);
    expect('memory' in agent).toBe(false);
  });

  it('rejects an empty id', () => {
    expect(() =>
      createAgent({ id: '', name: 'Mira', position: { x: 0, y: 0, z: 0 } }),
    ).toThrow();
  });

  it('rejects an empty name', () => {
    expect(() =>
      createAgent({ id: 'agent_1', name: '', position: { x: 0, y: 0, z: 0 } }),
    ).toThrow();
  });

  it('does not share position reference with the input', () => {
    const position = { x: 1, y: 1, z: 0 };
    const agent = createAgent({ id: 'a', name: 'A', position });
    expect(agent.position).not.toBe(position);
    expect(agent.position).toEqual(position);
  });
});

describe('setAgentPosition', () => {
  it('returns a new agent with updated position', () => {
    const agent = makeAgent();
    const moved = setAgentPosition(agent, { x: 3, y: 3, z: 1 });
    expect(moved.position).toEqual({ x: 3, y: 3, z: 1 });
  });

  it('does not mutate the original agent', () => {
    const agent = makeAgent();
    const moved = setAgentPosition(agent, { x: 7, y: 8, z: 0 });
    expect(agent.position).toEqual({ x: 2, y: 3, z: 0 });
    expect(moved).not.toBe(agent);
  });

  it('copies the position to avoid aliasing', () => {
    const agent = makeAgent();
    const target = { x: 5, y: 5, z: 0 };
    const moved = setAgentPosition(agent, target);
    expect(moved.position).not.toBe(target);
  });
});

describe('setAgentFacing', () => {
  it('returns a new agent with updated facing', () => {
    const agent = setAgentFacing(makeAgent(), 'north');
    expect(agent.facing).toBe('north');
  });

  it('does not mutate the original agent', () => {
    const agent = makeAgent();
    const turned = setAgentFacing(agent, 'west');
    expect(agent.facing).toBe('south');
    expect(turned).not.toBe(agent);
  });
});

describe('setAgentState', () => {
  it('returns a new agent with updated state', () => {
    const agent = setAgentState(makeAgent(), 'moving');
    expect(agent.state).toBe('moving');
  });

  it('does not mutate the original agent', () => {
    const agent = makeAgent();
    const busy = setAgentState(agent, 'acting');
    expect(agent.state).toBe('idle');
    expect(busy).not.toBe(agent);
  });
});

describe('isAgentIdle', () => {
  it('returns true for idle agents', () => {
    expect(isAgentIdle(makeAgent())).toBe(true);
  });

  it.each(['moving', 'acting', 'speaking', 'waiting'] as const)(
    'returns false for state %s',
    (state) => {
      expect(isAgentIdle(setAgentState(makeAgent(), state))).toBe(false);
    },
  );
});

describe('getDirectionFromDelta', () => {
  it.each([
    [{ x: 1, y: 0 }, 'east'],
    [{ x: -1, y: 0 }, 'west'],
    [{ x: 0, y: 1 }, 'south'],
    [{ x: 0, y: -1 }, 'north'],
    [{ x: 3, y: 1 }, 'east'],
    [{ x: 1, y: 3 }, 'south'],
    [{ x: -2, y: 1 }, 'west'],
    [{ x: 0, y: -5 }, 'north'],
  ] as const)('getDirectionFromDelta(%o) === %s', (delta, expected) => {
    expect(getDirectionFromDelta(delta)).toBe(expected);
  });

  it('returns undefined for a zero delta', () => {
    expect(getDirectionFromDelta({ x: 0, y: 0 })).toBeUndefined();
  });
});

describe('serialization', () => {
  it('round-trips through JSON.stringify / JSON.parse', () => {
    const agent = createAgent({
      id: 'agent_1',
      name: 'Mira',
      position: { x: 2, y: 3, z: 1 },
      facing: 'east',
      state: 'moving',
      data: { skin: 'green' },
      traits: { curiosity: 0.8 },
      memory: { lastSeen: { x: 1, y: 1, z: 0 } },
    });
    const restored = JSON.parse(JSON.stringify(agent));
    expect(restored).toEqual(agent);
  });
});
