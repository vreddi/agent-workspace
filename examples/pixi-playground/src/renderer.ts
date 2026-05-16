import type { GridPosition } from '@worldkit/grid';
import { worldToGrid } from '@worldkit/grid';
import type { Path } from '@worldkit/pathfinding';
import { isCellBlocked, type World } from '@worldkit/world';
import { Application, Container, Graphics } from 'pixi.js';

const COLOR_GRASS = 0x3b4357;
const COLOR_GRASS_ALT = 0x424b61;
const COLOR_WATER = 0x2c5872;
const COLOR_WALL = 0x1a1d24;
const COLOR_GRID_LINE = 0x2a2f3a;
const COLOR_START = 0x3ddc84;
const COLOR_GOAL = 0xffb347;
const COLOR_PATH = 0x7aa2ff;
const COLOR_HOVER = 0xffffff;

type Layers = {
  terrain: Graphics;
  objects: Graphics;
  path: Graphics;
  markers: Graphics;
  hover: Graphics;
};

export type RenderState = {
  world: World;
  path: Path | undefined;
  start: GridPosition;
  goal: GridPosition;
  hover: GridPosition | undefined;
};

export type CellPointer = {
  cell: GridPosition;
  button: 'left' | 'right';
  shiftKey: boolean;
};

export type Renderer = {
  app: Application;
  draw: (state: RenderState) => void;
  destroy: () => void;
};

export async function createRenderer(input: {
  parent: HTMLElement;
  width: number;
  height: number;
  cellSize: number;
  onCellPointerDown: (event: CellPointer) => void;
  onCellHover: (cell: GridPosition | undefined) => void;
}): Promise<Renderer> {
  const { parent, width, height, cellSize } = input;

  const app = new Application();
  await app.init({
    width: width * cellSize,
    height: height * cellSize,
    backgroundColor: 0x0f1115,
    antialias: true,
  });
  parent.appendChild(app.canvas);

  const layers: Layers = {
    terrain: new Graphics(),
    objects: new Graphics(),
    path: new Graphics(),
    markers: new Graphics(),
    hover: new Graphics(),
  };

  const stage = new Container();
  stage.addChild(layers.terrain);
  stage.addChild(layers.objects);
  stage.addChild(layers.path);
  stage.addChild(layers.markers);
  stage.addChild(layers.hover);
  app.stage.addChild(stage);

  // Make the whole canvas interactive. We translate pointer events into
  // grid-cell events so callers don't need to know about pixels.
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;

  const grid = { width, height, cellSize };

  const pointerToCell = (event: { global: { x: number; y: number } }):
    | GridPosition
    | undefined => {
    const cell = worldToGrid(grid, { x: event.global.x, y: event.global.y });
    if (
      cell.x < 0 ||
      cell.y < 0 ||
      cell.x >= width ||
      cell.y >= height
    ) {
      return undefined;
    }
    return cell;
  };

  app.stage.on('pointerdown', (event) => {
    const cell = pointerToCell(event);
    if (!cell) return;
    const button = event.button === 2 ? 'right' : 'left';
    input.onCellPointerDown({
      cell,
      button,
      shiftKey: Boolean(event.shiftKey),
    });
  });

  app.stage.on('pointermove', (event) => {
    input.onCellHover(pointerToCell(event));
  });

  app.stage.on('pointerleave', () => input.onCellHover(undefined));

  // Block the default browser context menu so right-click can be a tool.
  app.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const draw = (state: RenderState) => {
    drawTerrain(layers.terrain, state.world, grid);
    drawObjects(layers.objects, state.world, grid);
    drawPath(layers.path, state.path, grid);
    drawMarkers(layers.markers, state.start, state.goal, grid);
    drawHover(layers.hover, state.hover, grid);
  };

  const destroy = () => {
    app.destroy(true, { children: true });
  };

  return { app, draw, destroy };
}

function cellRect(
  g: Graphics,
  cell: GridPosition,
  cellSize: number,
  inset = 0,
): Graphics {
  return g.rect(
    cell.x * cellSize + inset,
    cell.y * cellSize + inset,
    cellSize - inset * 2,
    cellSize - inset * 2,
  );
}

function drawTerrain(
  g: Graphics,
  world: World,
  grid: { width: number; height: number; cellSize: number },
): void {
  g.clear();
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = { x, y };
      const terrain = world.terrain[`${x},${y}`];
      let color: number;
      if (terrain?.terrain === 'water') {
        color = COLOR_WATER;
      } else {
        // Subtle checker for grass to give the grid some texture.
        color = (x + y) % 2 === 0 ? COLOR_GRASS : COLOR_GRASS_ALT;
      }
      cellRect(g, cell, grid.cellSize).fill({ color });
    }
  }

  // Grid lines on top of terrain.
  for (let x = 0; x <= grid.width; x++) {
    g.moveTo(x * grid.cellSize, 0)
      .lineTo(x * grid.cellSize, grid.height * grid.cellSize);
  }
  for (let y = 0; y <= grid.height; y++) {
    g.moveTo(0, y * grid.cellSize)
      .lineTo(grid.width * grid.cellSize, y * grid.cellSize);
  }
  g.stroke({ color: COLOR_GRID_LINE, width: 1, alpha: 0.8 });
}

function drawObjects(
  g: Graphics,
  world: World,
  grid: { cellSize: number },
): void {
  g.clear();
  for (const object of Object.values(world.objects)) {
    if (object.type === 'wall') {
      cellRect(g, object.position, grid.cellSize, 2).fill({
        color: COLOR_WALL,
      });
    }
  }
}

function drawPath(
  g: Graphics,
  path: Path | undefined,
  grid: { cellSize: number },
): void {
  g.clear();
  if (!path || path.length < 2) return;

  const half = grid.cellSize / 2;

  // Soft underlay — a wide translucent stroke that gives the path a halo.
  g.moveTo(path[0]!.x * grid.cellSize + half, path[0]!.y * grid.cellSize + half);
  for (let i = 1; i < path.length; i++) {
    g.lineTo(
      path[i]!.x * grid.cellSize + half,
      path[i]!.y * grid.cellSize + half,
    );
  }
  g.stroke({
    color: COLOR_PATH,
    width: grid.cellSize * 0.55,
    alpha: 0.18,
    cap: 'round',
    join: 'round',
  });

  // Crisp center line.
  g.moveTo(path[0]!.x * grid.cellSize + half, path[0]!.y * grid.cellSize + half);
  for (let i = 1; i < path.length; i++) {
    g.lineTo(
      path[i]!.x * grid.cellSize + half,
      path[i]!.y * grid.cellSize + half,
    );
  }
  g.stroke({
    color: COLOR_PATH,
    width: 3,
    alpha: 0.95,
    cap: 'round',
    join: 'round',
  });

  // Step dots, smaller on interior steps.
  for (let i = 1; i < path.length - 1; i++) {
    g.circle(
      path[i]!.x * grid.cellSize + half,
      path[i]!.y * grid.cellSize + half,
      3,
    ).fill({ color: COLOR_PATH, alpha: 0.9 });
  }
}

function drawMarkers(
  g: Graphics,
  start: GridPosition,
  goal: GridPosition,
  grid: { cellSize: number },
): void {
  g.clear();
  const half = grid.cellSize / 2;
  const r = grid.cellSize * 0.32;

  // Start: green circle with a ring.
  g.circle(start.x * grid.cellSize + half, start.y * grid.cellSize + half, r)
    .fill({ color: COLOR_START, alpha: 0.95 });
  g.circle(
    start.x * grid.cellSize + half,
    start.y * grid.cellSize + half,
    r + 4,
  ).stroke({ color: COLOR_START, width: 2, alpha: 0.45 });

  // Goal: orange diamond.
  const cx = goal.x * grid.cellSize + half;
  const cy = goal.y * grid.cellSize + half;
  g.poly([cx, cy - r, cx + r, cy, cx, cy + r, cx - r, cy])
    .fill({ color: COLOR_GOAL, alpha: 0.95 });
  g.poly([
    cx,
    cy - r - 4,
    cx + r + 4,
    cy,
    cx,
    cy + r + 4,
    cx - r - 4,
    cy,
  ]).stroke({ color: COLOR_GOAL, width: 2, alpha: 0.45 });
}

function drawHover(
  g: Graphics,
  hover: GridPosition | undefined,
  grid: { cellSize: number },
): void {
  g.clear();
  if (!hover) return;
  cellRect(g, hover, grid.cellSize, 1).stroke({
    color: COLOR_HOVER,
    width: 1.5,
    alpha: 0.4,
  });
}

export function describeBlock(
  world: World,
  cell: GridPosition,
): string | undefined {
  if (!isCellBlocked(world, cell)) return undefined;
  const terrain = world.terrain[`${cell.x},${cell.y}`];
  if (terrain?.blocksMovement) return terrain.terrain;
  for (const object of Object.values(world.objects)) {
    if (
      object.blocksMovement &&
      object.position.x === cell.x &&
      object.position.y === cell.y
    ) {
      return object.type;
    }
  }
  return 'blocked';
}
