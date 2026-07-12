import { createGrid } from '@worldkit/grid'
import { addObject, createWorld, setTerrain, type World } from '@worldkit/world'

export const GRID_WIDTH = 24
export const GRID_HEIGHT = 16
export const CELL_SIZE = 32

/**
 * A small demo world: open grass, a kidney-shaped lake of water, and a few
 * walls forming a partial corridor. Enough variety to make pathfinding
 * visually interesting without being a maze.
 */
export function buildInitialWorld(): World {
  let world = createWorld({
    id: 'pixi-playground',
    name: 'Pixi Playground',
    grid: createGrid({
      width: GRID_WIDTH,
      height: GRID_HEIGHT,
      cellSize: CELL_SIZE,
    }),
  })

  // Water blob — impassable.
  const water: Array<[number, number]> = [
    [6, 4],
    [7, 4],
    [8, 4],
    [5, 5],
    [6, 5],
    [7, 5],
    [8, 5],
    [9, 5],
    [5, 6],
    [6, 6],
    [7, 6],
    [8, 6],
    [9, 6],
    [6, 7],
    [7, 7],
    [8, 7],
  ]
  for (const [x, y] of water) {
    world = setTerrain(world, {
      position: { x, y },
      terrain: 'water',
      blocksMovement: true,
    })
  }

  // Walls — partial corridor on the right side.
  const walls: Array<[number, number]> = [
    [14, 2],
    [14, 3],
    [14, 4],
    [14, 5],
    [14, 6],
    [14, 7],
    [14, 9],
    [14, 10],
    [14, 11],
    [14, 12],
    [14, 13],
    [15, 7],
    [16, 7],
    [17, 7],
    [18, 7],
    [19, 7],
  ]
  for (const [x, y] of walls) {
    world = addObject(world, {
      id: `wall_${x}_${y}`,
      type: 'wall',
      position: { x, y },
      blocksMovement: true,
    })
  }

  return world
}

export function toggleWall(world: World, x: number, y: number): World {
  const id = `wall_${x}_${y}`
  if (world.objects[id]) {
    const { [id]: _removed, ...rest } = world.objects
    return { ...world, objects: rest }
  }
  return addObject(world, {
    id,
    type: 'wall',
    position: { x, y },
    blocksMovement: true,
  })
}
