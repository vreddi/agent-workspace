import type { GridPosition } from '@worldkit/grid';
import { positionsEqual } from '@worldkit/grid';
import { findPath, type Path } from '@worldkit/pathfinding';
import { isCellBlocked, type World } from '@worldkit/world';
import {
  createRenderer,
  describeBlock,
  type CellPointer,
} from './renderer.js';
import {
  buildInitialWorld,
  CELL_SIZE,
  GRID_HEIGHT,
  GRID_WIDTH,
  toggleWall,
} from './world-setup.js';

type AppState = {
  world: World;
  start: GridPosition;
  goal: GridPosition;
  hover: GridPosition | undefined;
};

const stage = document.getElementById('stage')!;
const statusEl = document.getElementById('status')!;

let state: AppState = {
  world: buildInitialWorld(),
  start: { x: 1, y: 1 },
  goal: { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 },
  hover: undefined,
};

const renderer = await createRenderer({
  parent: stage,
  width: GRID_WIDTH,
  height: GRID_HEIGHT,
  cellSize: CELL_SIZE,
  onCellPointerDown: handlePointerDown,
  onCellHover: handleHover,
});

function handlePointerDown(event: CellPointer): void {
  const { cell, button, shiftKey } = event;
  if (button === 'right') {
    // Don't allow walling over the start or the goal — too easy to soft-lock.
    if (positionsEqual(cell, state.start) || positionsEqual(cell, state.goal)) {
      return;
    }
    state = { ...state, world: toggleWall(state.world, cell.x, cell.y) };
    redraw();
    return;
  }

  // Left click. Shift = set start, otherwise set goal.
  if (isCellBlocked(state.world, cell)) {
    // Refuse to teleport into a wall/water — keep the example honest.
    return;
  }

  if (shiftKey) {
    if (positionsEqual(cell, state.goal)) return;
    state = { ...state, start: cell };
  } else {
    if (positionsEqual(cell, state.start)) return;
    state = { ...state, goal: cell };
  }
  redraw();
}

function handleHover(cell: GridPosition | undefined): void {
  // Only rerender when the hovered cell actually changes.
  const prev = state.hover;
  if (!prev && !cell) return;
  if (prev && cell && positionsEqual(prev, cell)) return;
  state = { ...state, hover: cell };
  // Hover-only updates don't need to recompute the path.
  renderer.draw({ ...state, path: lastPath });
}

let lastPath: Path | undefined;

function redraw(): void {
  const start = performance.now();
  lastPath = findPath(state.world, state.start, state.goal);
  const elapsed = performance.now() - start;
  renderer.draw({ ...state, path: lastPath });
  updateStatus(elapsed);
}

function updateStatus(elapsedMs: number): void {
  const parts: string[] = [];
  parts.push(`start (${state.start.x}, ${state.start.y})`);
  parts.push(`→ goal (${state.goal.x}, ${state.goal.y})`);
  if (lastPath) {
    parts.push(`path: ${lastPath.length - 1} steps`);
  } else {
    parts.push('path: no route');
  }
  parts.push(`A*: ${elapsedMs.toFixed(2)}ms`);

  if (state.hover) {
    const block = describeBlock(state.world, state.hover);
    parts.push(
      `hover: (${state.hover.x}, ${state.hover.y})${block ? ` [${block}]` : ''}`,
    );
  }

  statusEl.textContent = parts.join('  ·  ');
}

redraw();
