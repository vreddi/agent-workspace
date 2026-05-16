# @worldkit/example-pixi-playground

A small interactive playground that wires `@worldkit/world` and
`@worldkit/pathfinding` to a PixiJS canvas. Edit walls, drop the start or
goal anywhere on the grid, and watch A\* recompute the shortest path in
real time.

## Controls

- **Left-click** a walkable cell — set the **goal**.
- **Shift + left-click** a walkable cell — set the **start**.
- **Right-click** any cell — toggle a wall.

Walls and water terrain are impassable. The status line below the canvas
shows the current start and goal, path length, and how long A\* took on
the last solve.

## Run it

From the repo root:

```bash
pnpm install
pnpm --filter @worldkit/example-pixi-playground dev
```

Then open <http://localhost:5173>.

The Vite config resolves `@worldkit/*` imports directly to TypeScript
source via the `@org/source` export condition — no need to build the
packages first.

## What this demonstrates

- `@worldkit/grid` `worldToGrid` for screen → grid translation.
- `@worldkit/world` terrain and objects as the source of occupancy.
- `@worldkit/pathfinding` `findPath` running on every input event.
- The headless core has zero rendering knowledge — Pixi is layered on
  top as a pure adapter.
