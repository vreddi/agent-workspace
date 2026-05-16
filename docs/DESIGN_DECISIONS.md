# Design Decisions

This document explains the "why" behind key architectural choices.

## 1. Plain Objects > Class-Based State

**Decision:** World state is plain serializable data (objects, arrays, primitives), not encapsulated classes.

**Example:**
```ts
// ✅ Good
type World = {
  id: string;
  entities: Record<EntityId, WorldEntity>;
  terrain: TerrainCell[];
};

// ❌ Avoid
class World {
  private entities = new Map();
  getEntity(id) { return this.entities.get(id); }
  // ... lots of boilerplate
}
```

**Why:**
- **Serialization:** Easy to save/load JSON, no custom serializers needed
- **Immutability:** Easy to create new versions for undo/redo, replay, forking
- **Testing:** Easy to construct test data, compare states
- **Debugging:** Easy to inspect in browser console or logs
- **Sync/Multiplayer:** Easy to diff, patch, or send over the wire
- **AI:** LLMs can understand and manipulate structured data better than opaque classes

**Tradeoff:** Less encapsulation. Update helpers must be careful not to mutate shared state. Use TypeScript's `readonly` to enforce immutability at the type level.

---

## 2. Actions as Control Boundary

**Decision:** External agents (AI, players, scripts) don't mutate world state directly. They propose **actions**, and the **simulation validates and applies them**.

**Example:**
```ts
// ❌ Bad (direct mutation)
agent.x = 10;
agent.y = 8;

// ✅ Good (action-based)
sim.dispatch({
  type: "move.to",
  actorId: "agent_1",
  target: { x: 10, y: 8 }
});

// Simulation then:
// 1. Validates the action (is target in bounds? is agent real?)
// 2. Checks preconditions (is path walkable?)
// 3. Executes the action (moves agent, emits events)
// 4. Returns result or error
```

**Why:**
- **Validation:** All state changes go through a single, auditable gate
- **Safety:** Invalid AI suggestions are caught and reported, not applied
- **Determinism:** Action dispatch is reproducible, testable, replayable
- **Multiplayer:** Server can validate all player actions before accepting
- **Events:** All changes produce events, enabling undo/redo, replay, logs
- **AI Learning:** Models get structured feedback on whether their actions succeeded

**Tradeoff:** Slightly more verbose API. But the safety and control are worth it.

---

## 3. No Rendering in Core Packages

**Decision:** Simulation and world state have zero knowledge of rendering. Rendering is an optional adapter layer.

**Example:**
```ts
// ❌ Bad (rendering in core)
type Agent = {
  id: string;
  position: GridPosition;
  sprite?: PIXISprite;        // ← NO
  animationFrame?: number;
};

// ✅ Good (clean separation)
type Agent = {
  id: string;
  position: GridPosition;
  // That's it!
};

// Rendering layer maps Agent → Sprite based on AssetDefinition
```

**Why:**
- **Headless:** Run simulation without any graphics library (tests, servers, benchmarks)
- **Swappable:** Use PixiJS, Canvas, Three.js, or DOM with the same world state
- **Performance:** Core logic is lightweight, no rendering overhead
- **Framework Agnostic:** Core works in Node.js, browsers, workers, anywhere TypeScript runs
- **Asset-Driven:** Artists provide asset definitions; rendering layer interprets them

**Tradeoff:** Rendering layer must listen to events and build a separate state (e.g., sprite positions). But this is a thin mapping, not logic.

---

## 4. No React in Core Packages

**Decision:** `@worldkit/react` is optional and thin. Core logic has zero React dependencies.

**Why:**
- **Reusability:** Same world logic in Vue, Svelte, plain JS, or no framework
- **Testing:** Core logic is testable without mounting React components
- **Performance:** React is a GUI layer, not a simulation layer
- **Clarity:** Separates "what the world does" from "how the UI displays it"

**Tradeoff:** Build your own integration if you don't use React. Or wait for the optional `@worldkit/react` package.

---

## 5. No AI SDK in Core

**Decision:** `@worldkit/ai` is optional and provider-agnostic. Core actions don't depend on OpenAI, Anthropic, etc.

**Why:**
- **Flexibility:** Use Claude, GPT-4, local models, or custom logic
- **Licensing:** Users choose their AI provider, not us
- **Stability:** AI APIs change; core should be stable
- **Open Source:** No vendor lock-in
- **Offline:** Core can run anywhere, AI integration is optional

**Approach:**
- `@worldkit/actions` defines action schemas (JSON)
- `@worldkit/ai` provides helpers to build observations, filter actions, parse responses
- **You** integrate with your chosen AI provider

**Example:**
```ts
// Our code (provider-agnostic)
const observation = buildObservation(world, agentId);
const allowedActions = getAllowedActions(world, agentId);

// Your code (your choice of AI)
const response = await anthropic.messages.create({
  model: "claude-3-opus",
  messages: [{ role: "user", content: observation }],
  // ... constraint on allowed actions ...
});

const action = parseAction(response);
sim.dispatch(action);
```

**Tradeoff:** You must write the integration glue. But it's straightforward.

---

## 6. Modular Packages with Clear Dependencies

**Decision:** One concern per package, minimal dependencies, clear import hierarchy.

**Example Structure:**
```
core       (no deps)
  ↑
grid, world, agents, actions  (depend on core only)
  ↑
pathfinding, movement         (depend on grid + world + core)
  ↑
simulation                     (depends on everything)
  ↑
renderer, react, editor, ai   (optional, depend on simulation + world)
```

**Why:**
- **Understandable:** Each package has one job
- **Testable:** Can test each package in isolation
- **Reusable:** If you only need pathfinding, you don't pay for simulation code
- **Parallel Development:** Multiple people can work on different packages
- **Tree-Shaking:** Dead code elimination works better with small, focused modules
- **Debuggable:** Clear which package owns which concern

**Tradeoff:** More files and folders than a monolithic design. But easier to navigate and modify.

---

## 7. Grid-Based Positions, Freeform Visuals

**Decision:** Logic layer uses discrete grid coordinates. Rendering layer adds offsets, rotation, animations.

**Example:**
```ts
// Simulation (grid-based)
type GridPosition = { x: number; y: number };
const agent = { position: { x: 5, y: 3 } };

// Rendering (freeform)
type VisualTransform = {
  offset?: { x: number; y: number };     // Shake, jitter
  rotation?: number;                      // Angle toward target
  scale?: number;                         // Breathing animation
  zIndex?: number;
};

// Renderer maps GridPosition + VisualTransform → final sprite position
const screenX = gridX * cellSize + offset.x;
const screenY = gridY * cellSize + offset.y;
```

**Why:**
- **Determinism:** Grid ensures collision and pathfinding are predictable
- **Artistry:** Visuals can be organic, cozy, hand-drawn-looking
- **Clarity:** "Is the agent at cell (5,3)?" is always true/false
- **Performance:** No floating-point precision issues
- **Simplicity:** Artists don't need to understand grid math

**Tradeoff:** Rendering layer must perform the grid-to-visual mapping. Small overhead, worth it.

---

## 8. Events Over Callbacks

**Decision:** Simulation emits typed events. External code listens; not the other way around.

**Example:**
```ts
// ✅ Event-based
sim.on("agent.moved", (e) => {
  console.log(`${e.agentId} moved to (${e.to.x}, ${e.to.y})`);
});

// ❌ Callback-based (avoided)
sim.onAgentMoved = (agentId, from, to) => { /* ... */ };
```

**Why:**
- **Decoupling:** Simulation doesn't need to know what listeners do
- **Multiple Listeners:** Many systems can react to the same event
- **Async Friendly:** Listeners can be async or long-running
- **Replaying:** Log events and replay them later
- **Testing:** Easy to verify events were emitted
- **Type Safety:** TypeScript can check event types

**Tradeoff:** Slightly more setup, but much cleaner architecture.

---

## 9. Validation at Dispatch, Not Construction

**Decision:** World state accepts any valid structure; actions are validated when dispatched.

**Example:**
```ts
// ✅ World accepts data as-is
const world = createWorld({
  entities: { agent_1: { position: { x: 0, y: 0 } } }
});

// Action is validated at dispatch time
sim.dispatch({ type: "move.to", actorId: "agent_1", target: { x: 100, y: 100 } });
// Simulation checks: Is agent_1 real? Is (100,100) in bounds? Is path walkable?
```

**Why:**
- **Flexibility:** You can construct any world you want for testing
- **Clear Errors:** Failed actions emit events with failure reasons
- **Reproducibility:** Same world + same actions = same results
- **Loading:** Load world from JSON without running validators

**Tradeoff:** Bugs could slip through if you forget to dispatch actions. Use TypeScript and tests to catch these.

---

## 10. Immutable Updates with Helpers

**Decision:** World state updates are done with helper functions that return new objects, not mutations.

**Example:**
```ts
// ✅ Immutable update
const newWorld = updateAgent(world, agentId, { position: { x: 10, y: 8 } });

// ❌ Mutation (avoided)
world.entities[agentId].position = { x: 10, y: 8 };
```

**Why:**
- **Undo/Redo:** Easy to store old state and swap back
- **Replay:** Can run the same world through the same actions again
- **Concurrency:** No race conditions if multiple systems update state
- **Diffing:** Can compare two states to see what changed
- **Time Travel:** Debugging tools can step backward

**Tradeoff:** Slightly more code and memory (old state is kept). But for determinism and debugging, it's worth it.

---

## 11. Start with Headless, Add Rendering Later

**Decision:** Milestone 1 is a fully working simulation with zero rendering. Add graphics only after core is solid.

**Why:**
- **Validation:** Prove the logic works before adding rendering complexity
- **Testing:** Easier to test headless (no browser, no graphics library)
- **Focus:** One concern at a time
- **Parallelism:** Artists can start on visuals while logic is being refined
- **Decoupling:** Rendering layer is built after core is stable

**Tradeoff:** You don't see pretty pictures until Milestone 2. But the foundation is solid.

---

## 12. Explicit Type Exports

**Decision:** Each package exports only its public API. Internal types are not re-exported from bundle.

**Example:**
```ts
// src/index.ts
export type { Agent, AgentState } from "./agent";
export { createAgent } from "./agent";

// ✗ Don't export everything
export * from "./internal/helpers";  // ← No
```

**Why:**
- **Clarity:** Users know what's public API and what's internal
- **Stability:** Public API is stable; internals can change
- **Tree-Shaking:** Unused internals can be stripped
- **Documentation:** Public API is documented; internals are optional

**Tradeoff:** More explicit exports. But much clearer contracts.

---

## Summary

These decisions add up to a toolkit that is:
- **Logical:** Grid-based, predictable, deterministic
- **Artistic:** Can render beautifully, freeform-looking
- **Safe:** Actions are validated, AI can't break the world
- **Flexible:** Can use any rendering, any AI, any UI framework
- **Testable:** Headless, no external dependencies, easy to mock
- **Maintainable:** Clear packages, explicit APIs, good separation of concerns

The design prioritizes **clarity** and **correctness** over cleverness.
