# Project Vision: Grid-Based World Package Suite

## The Problem

Game engines and world-building toolkits typically force a choice:

1. **Full game engines** (Godot, Unreal, Unity) — Powerful but heavyweight, not designed for fine-grained simulation control or AI integration
2. **Grid-based frameworks** (traditional roguelike libraries) — Logically clean but visually dated and not ergonomic for modern web
3. **Canvas/DOM toolkits** — Great for 2D graphics but lack simulation primitives, pathfinding, collision, and agent control

We're building something in between.

## Our Solution

A **composable TypeScript toolkit** that separates:
- **Logic layer:** Grid-based world state, pathfinding, collision, action validation
- **Rendering layer:** Artistic, freeform-looking 2D visuals that hide the grid
- **Control layer:** Structured actions as the boundary between simulation and external agents (AI, players, scripts)

This enables:
- **Cozy, organic-looking worlds** that are actually grid-based and predictable underneath
- **AI-friendly action system** where models can safely suggest moves without directly mutating state
- **Playable worlds** without writing a graphics engine
- **Reusable components** (pathfinding, collision, agents) across many projects
- **Easy testing** because the simulation is headless and deterministic

## Design Inspiration

- **Roguelike libraries** (Rot.js, libtcod) — Clean grid logic, action-driven, event-based
- **Cozy games** (Spiritfarer, A Short Hike, Stardew Valley) — Organic visuals, accessible, grid-based underneath
- **LLM control systems** — Structured actions, observation building, validation boundaries
- **Web-first tools** — Modern TypeScript, ESM, tree-shakeable, framework-agnostic

## Core Philosophy

### Separate What Changes

- **Logic** changes slowly. Grid rules, pathfinding, collision are stable.
- **Visuals** change constantly. Artists want rotation, shadows, organic shapes.
- **AI strategy** changes per integration. One world serves multiple AI backends.
- **UI/UX** varies by app. Same simulation powers different editors and renderers.

By keeping these layers separate, we can:
- Reuse pathfinding across PixiJS, Canvas, Three.js, or DOM renderers
- Run headless simulation for testing and server-side replay
- Swap AI backends without changing world state
- Let artists design beautiful visuals without touching simulation code

### Simplicity First

- Core packages have NO dependencies beyond TypeScript
- World state is plain serializable data, not opaque class instances
- Actions are explicit JSON structures, not function calls
- Simulation is a pure function: `(state, action, dt) → (state, events)`
- Rendering adapters are optional, not mandatory

### AI as a First-Class Citizen

- Actions are the control boundary
- Simulation validates all actions before applying them
- Agents get structured observations, not direct world access
- Constrained action lists prevent invalid AI suggestions
- Event stream provides feedback loop for learning

## Example Use Cases

### 1. Cozy Sandbox World
Create an interactive 2D space where the player manages agents and environments:
- Grid-based placement and movement
- Animated characters with pathfinding
- Customizable terrain and objects
- Visual polish with PixiJS or Three.js

### 2. Map Editor
Build a tool for designing worlds:
- Grid snapping, brush tools, object placement
- Serialize world to JSON
- Preview with the renderer
- Export for deployment

### 3. Agent Simulation
Run a headless simulation with AI-controlled agents:
- LLMs propose actions
- Simulation validates and executes
- Events drive agent learning
- No rendering overhead
- Deterministic replay and debugging

### 4. Educational Tool
Teach pathfinding, AI, or game design:
- Simple, readable codebase
- Step-through simulation
- Visualize algorithms
- No hidden magic

### 5. Collaborative World
Multiple agents (players, NPCs, AI) in one world:
- Structured actions enable multiplayer
- Server validates all moves
- Event log is replay and audit trail
- Client can be lightweight renderer

## What This IS

✓ A composable simulation toolkit  
✓ Grid-based world logic  
✓ Renderer-agnostic  
✓ TypeScript-first  
✓ AI-friendly action system  
✓ Serializable state  
✓ Test-friendly (headless)  
✓ Asset-driven (pluggable visuals)  

## What This ISN'T

✗ A full game engine  
✗ A graphics library (we use adapters instead)  
✗ A physics engine  
✗ An AI SDK (we integrate with AI, not embed it)  
✗ A multiplayer framework (but designed to support it)  
✗ A specific art style (we enable many styles)  

## Strategic Goals

1. **Milestone 1:** Solid headless simulation (pathfinding, actions, events)
2. **Milestone 2:** Optional rendering layer (PixiJS, Canvas, etc.)
3. **Milestone 3:** React integration and editor tools
4. **Milestone 4:** AI integration helpers and examples
5. **Beyond:** Community asset packs, plugins, extensions

The toolkit succeeds when:
- Artists can style worlds without touching simulation
- AI engineers can control agents with structured actions
- Game developers can build cozy, organic-looking worlds easily
- Researchers can run deterministic simulations at scale

## Naming

The project scope and name may evolve. Current scope: "Grid-based world package suite."

Naming suggestions aligned with the vibe: **WorldWeave**, because the logic is a grid, but the surface is a tapestry.
