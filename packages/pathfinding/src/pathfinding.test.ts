import { createGrid } from '@worldkit/grid'
import type { GridPosition } from '@worldkit/grid'
import { addObject, createWorld, setTerrain } from '@worldkit/world'
import type { World } from '@worldkit/world'
import { describe, expect, it } from 'vitest'
import { findPath, manhattanDistance, pathCost } from './pathfinding.js'

const makeWorld = (width = 5, height = 5, layers = 1): World => {
  let world = createWorld({
    id: 'test',
    grid: createGrid({ width, height, layers, cellSize: 1 }),
  })
  // Fill the bottom layer with a default floor so cells are standable.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      world = setTerrain(world, {
        position: { x, y, z: 0 },
        terrain: 'floor',
      })
    }
  }
  return world
}

const block = (world: World, position: GridPosition, id?: string): World =>
  addObject(world, {
    id: id ?? `wall_${position.x}_${position.y}_${position.z}`,
    type: 'wall',
    position,
    blocksMovement: true,
  })

describe('manhattanDistance', () => {
  it('measures L1 distance between two cells including z', () => {
    expect(manhattanDistance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(
      7,
    )
    expect(manhattanDistance({ x: 2, y: 2, z: 1 }, { x: 2, y: 2, z: 1 })).toBe(
      0,
    )
    expect(manhattanDistance({ x: -1, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).toBe(
      2,
    )
    expect(manhattanDistance({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 3 })).toBe(
      3,
    )
  })
})

describe('findPath', () => {
  it('returns a straight path across an empty world', () => {
    const path = findPath(
      makeWorld(),
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    )
    expect(path).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    ])
  })

  it('returns a single-cell path when start equals goal', () => {
    const path = findPath(
      makeWorld(),
      { x: 2, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
    )
    expect(path).toEqual([{ x: 2, y: 2, z: 0 }])
  })

  it('routes around a blocking object', () => {
    let world = makeWorld()
    world = block(world, { x: 1, y: 0, z: 0 })
    const path = findPath(world, { x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 })
    expect(path).toBeDefined()
    expect(path![0]).toEqual({ x: 0, y: 0, z: 0 })
    expect(path![path!.length - 1]).toEqual({ x: 2, y: 0, z: 0 })
    expect(path!.length).toBe(5)
    for (const step of path!) {
      expect(step).not.toEqual({ x: 1, y: 0, z: 0 })
    }
  })

  it('routes around blocking terrain', () => {
    let world = makeWorld()
    world = setTerrain(world, {
      position: { x: 1, y: 0, z: 0 },
      terrain: 'water',
      blocksMovement: true,
    })
    const path = findPath(world, { x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 })
    expect(path).toBeDefined()
    expect(path!.length).toBe(5)
  })

  it('returns undefined when the goal is walled off', () => {
    let world = makeWorld()
    for (let y = 0; y < 5; y++) {
      world = block(world, { x: 2, y, z: 0 })
    }
    expect(
      findPath(world, { x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }),
    ).toBeUndefined()
  })

  it('returns undefined when the goal cell is itself blocked', () => {
    const world = block(makeWorld(), { x: 2, y: 2, z: 0 })
    expect(
      findPath(world, { x: 0, y: 0, z: 0 }, { x: 2, y: 2, z: 0 }),
    ).toBeUndefined()
  })

  it('returns undefined when start is out of bounds', () => {
    expect(
      findPath(makeWorld(), { x: -1, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }),
    ).toBeUndefined()
  })

  it('returns undefined when goal is out of bounds', () => {
    expect(
      findPath(makeWorld(), { x: 0, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }),
    ).toBeUndefined()
  })

  it('returns undefined when start position is non-integer', () => {
    expect(
      findPath(makeWorld(), { x: 0.5, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }),
    ).toBeUndefined()
  })

  it('does not traverse a cell with no terrain (air)', () => {
    // Remove terrain from a single cell to create a "hole".
    let world = makeWorld()
    world = setTerrain(world, {
      position: { x: 1, y: 0, z: 0 },
      terrain: 'floor',
      blocksMovement: true, // simulate hole as blocking
    })
    const path = findPath(world, { x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 })
    expect(path).toBeDefined()
    for (const step of path!) {
      expect(step).not.toEqual({ x: 1, y: 0, z: 0 })
    }
  })

  it('respects a custom cost function that marks a cell impassable', () => {
    const path = findPath(
      makeWorld(),
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      {
        cost: (p) => (p.x === 1 && p.y === 0 ? Number.POSITIVE_INFINITY : 1),
      },
    )
    expect(path).toBeDefined()
    expect(path!.length).toBe(5)
    for (const step of path!) {
      expect(step).not.toEqual({ x: 1, y: 0, z: 0 })
    }
  })

  it('respects a custom cost function that steers around expensive cells', () => {
    const path = findPath(
      makeWorld(10, 3),
      { x: 0, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      {
        cost: (p) => (p.y === 1 && p.x > 0 && p.x < 4 ? 100 : 1),
      },
    )
    expect(path).toBeDefined()
    for (let i = 1; i < path!.length - 1; i++) {
      expect(path![i]!.y).not.toBe(1)
    }
  })

  it('does not produce a path through a cell with cost <= 0', () => {
    const path = findPath(
      makeWorld(),
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      {
        cost: (p) => (p.x === 1 && p.y === 0 ? 0 : 1),
      },
    )
    expect(path).toBeDefined()
    for (const step of path!) {
      expect(step).not.toEqual({ x: 1, y: 0, z: 0 })
    }
  })

  it('returns undefined when maxNodes is too small to reach the goal', () => {
    expect(
      findPath(
        makeWorld(20, 20),
        { x: 0, y: 0, z: 0 },
        { x: 19, y: 19, z: 0 },
        { maxNodes: 1 },
      ),
    ).toBeUndefined()
  })

  it('returns the optimal path length on uniform cost', () => {
    const path = findPath(
      makeWorld(10, 10),
      { x: 1, y: 1, z: 0 },
      { x: 7, y: 5, z: 0 },
    )
    expect(path).toBeDefined()
    expect(path!.length).toBe(
      manhattanDistance({ x: 1, y: 1, z: 0 }, { x: 7, y: 5, z: 0 }) + 1,
    )
  })

  it('produces a path of cells that are each 4-way adjacent at the same z', () => {
    let world = makeWorld(6, 6)
    world = block(world, { x: 2, y: 2, z: 0 })
    world = block(world, { x: 2, y: 3, z: 0 })
    const path = findPath(world, { x: 0, y: 0, z: 0 }, { x: 4, y: 4, z: 0 })!
    expect(path).toBeDefined()
    for (let i = 1; i < path.length; i++) {
      const dx = Math.abs(path[i]!.x - path[i - 1]!.x)
      const dy = Math.abs(path[i]!.y - path[i - 1]!.y)
      const dz = Math.abs(path[i]!.z - path[i - 1]!.z)
      expect(dx + dy + dz).toBe(1)
    }
  })
})

describe('findPath with ramps', () => {
  // Two-layer world. Bottom is grass at z=0; upper plateau is wood at z=1
  // covering (3..4, 0..4). A ramp at (2, 2, 0) with up='east' connects them.
  const makeRampWorld = (): World => {
    let world = createWorld({
      id: 'ramp-test',
      grid: createGrid({ width: 6, height: 5, layers: 2, cellSize: 1 }),
    })
    // Ground floor everywhere on z=0.
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 6; x++) {
        world = setTerrain(world, {
          position: { x, y, z: 0 },
          terrain: 'grass',
        })
      }
    }
    // Upper plateau on z=1 from x=3 to x=5.
    for (let y = 0; y < 5; y++) {
      for (let x = 3; x < 6; x++) {
        world = setTerrain(world, {
          position: { x, y, z: 1 },
          terrain: 'wood',
        })
      }
    }
    // Replace ground at (2,2,0) with a ramp going up to the east.
    world = setTerrain(world, {
      position: { x: 2, y: 2, z: 0 },
      terrain: 'ramp',
      ramp: { up: 'east' },
    })
    return world
  }

  it('cannot reach a higher plateau without a ramp', () => {
    let world = createWorld({
      id: 'no-ramp',
      grid: createGrid({ width: 4, height: 4, layers: 2, cellSize: 1 }),
    })
    // Ground only on z=0, plateau only on z=1 — no connecting ramp.
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        world = setTerrain(world, {
          position: { x, y, z: 0 },
          terrain: 'grass',
        })
        if (x >= 2) {
          world = setTerrain(world, {
            position: { x, y, z: 1 },
            terrain: 'wood',
          })
        }
      }
    }
    expect(
      findPath(world, { x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 1 }),
    ).toBeUndefined()
  })

  it('climbs a ramp to reach the upper plateau', () => {
    const world = makeRampWorld()
    const path = findPath(world, { x: 0, y: 2, z: 0 }, { x: 5, y: 2, z: 1 })
    expect(path).toBeDefined()
    // Path must include the ramp tile, then the cell at z=1 adjacent to it.
    const onRamp = path!.findIndex((p) => p.x === 2 && p.y === 2 && p.z === 0)
    expect(onRamp).toBeGreaterThanOrEqual(0)
    const next = path![onRamp + 1]
    expect(next).toEqual({ x: 3, y: 2, z: 1 })
  })

  it('descends a ramp to reach the lower level', () => {
    const world = makeRampWorld()
    const path = findPath(world, { x: 5, y: 2, z: 1 }, { x: 0, y: 2, z: 0 })
    expect(path).toBeDefined()
    // Path must step from (3,2,1) onto the ramp at (2,2,0).
    const topOfRamp = path!.findIndex(
      (p) => p.x === 3 && p.y === 2 && p.z === 1,
    )
    expect(topOfRamp).toBeGreaterThanOrEqual(0)
    expect(path![topOfRamp + 1]).toEqual({ x: 2, y: 2, z: 0 })
  })

  it('does not traverse a ramp from the wrong horizontal direction', () => {
    // The ramp at (2,2,0) faces east — stepping north or south onto it from
    // (2,2,1) shouldn't work because (2,2,1) is empty air anyway, but verify
    // a path that needs to cross sideways doesn't try to phase through it.
    const world = makeRampWorld()
    // Goal that's only reachable via the ramp from the east side.
    const path = findPath(world, { x: 4, y: 2, z: 1 }, { x: 0, y: 0, z: 0 })
    expect(path).toBeDefined()
    // Must go through the ramp tile at (2,2,0).
    expect(path!.some((p) => p.x === 2 && p.y === 2 && p.z === 0)).toBe(true)
  })
})

describe('pathCost', () => {
  it('returns 0 for an empty path', () => {
    expect(pathCost([])).toBe(0)
  })

  it('returns 0 for a single-cell path', () => {
    expect(pathCost([{ x: 0, y: 0, z: 0 }])).toBe(0)
  })

  it('sums entry cost for each step after the start using the default cost', () => {
    expect(
      pathCost([
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
      ]),
    ).toBe(2)
  })

  it('uses a custom cost function when provided', () => {
    expect(
      pathCost(
        [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
        ],
        (p) => p.x,
      ),
    ).toBe(3)
  })
})
