# @worldkit/agents

Headless agent model. The third brick: identity, position, facing, and state for
the characters that inhabit a `@worldkit/world`. No AI, no behavior, no
rendering — just a sturdy, serializable description of a character.

This package answers the boring, sacred questions:

- Who is this agent?
- Where are they standing?
- Which way are they facing?
- What are they doing right now?
- Are they free to act?
- Can they be saved and loaded?

## Install

```bash
pnpm add @worldkit/agents @worldkit/grid
```

## Usage

```ts
import {
  createAgent,
  isAgentIdle,
  setAgentFacing,
  setAgentPosition,
  setAgentState,
} from '@worldkit/agents'

const mira = createAgent({
  id: 'agent_1',
  name: 'Mira',
  position: { x: 2, y: 2 },
})

const moved = setAgentPosition(mira, { x: 3, y: 2 })
const facing = setAgentFacing(moved, 'east')
const busy = setAgentState(facing, 'moving')

isAgentIdle(mira) // true
isAgentIdle(busy) // false
```

## Immutability

Every mutator returns a new `Agent` instead of mutating in place. Undo, redo,
replay, sync, and AI validation all stay easy.

```ts
const next = setAgentPosition(agent, { x: 5, y: 5 })
```

## API

### Types

```ts
type AgentId = string

type AgentState = 'idle' | 'moving' | 'acting' | 'speaking' | 'waiting'

type Direction = 'north' | 'east' | 'south' | 'west'

type Agent = {
  id: AgentId
  name: string
  position: GridPosition
  facing: Direction
  state: AgentState
  data?: Record<string, unknown>
  traits?: Record<string, unknown>
  memory?: Record<string, unknown>
}
```

`data` is for appearance / UI / customization. `traits` and `memory` are
placeholders for future AI and personality systems — kept generic on purpose so
nothing here gets coupled to a provider.

### `createAgent({ id, name, position, facing?, state?, data?, traits?, memory? })`

Returns a new `Agent`. Defaults: `facing: 'south'`, `state: 'idle'`. Throws on
an empty `id` or empty `name`.

### `setAgentPosition(agent, position)`

Returns a new agent at `position`.

### `setAgentFacing(agent, facing)`

Returns a new agent with the given facing.

### `setAgentState(agent, state)`

Returns a new agent with the given state.

### `isAgentIdle(agent)`

`true` iff the agent's state is `'idle'`.

### `getDirectionFromDelta(delta)`

Converts a movement delta like `{ x: 1, y: 0 }` into a 4-way `Direction`. Ties
break in favor of horizontal motion. Returns `undefined` when the delta is
zero.

```ts
getDirectionFromDelta({ x: 1, y: 0 }) // 'east'
getDirectionFromDelta({ x: 0, y: -1 }) // 'north'
getDirectionFromDelta({ x: 0, y: 0 }) // undefined
```

## Design notes

- **Plain data.** `Agent` is a serializable object. `JSON.stringify` /
  `JSON.parse` round-trips cleanly. No classes, no methods, no hidden state.
- **No world coupling.** Agents don't know about terrain, occupancy, or
  pathfinding. The world owns those rules; agents just say where they are.
- **No AI.** `traits` and `memory` are reserved slots, not behavior. Smart
  agents come later, in a higher layer.
