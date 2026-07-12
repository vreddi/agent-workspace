import { positionsEqual } from '@worldkit/grid'
import type { GridPosition } from '@worldkit/grid'
import { beforeEach, describe, expect, it } from 'vitest'

import { makeCozyVillageScene } from '../demo/cozy-village'
import type { VillageScene } from './scene'
import { VillageSimulation } from './village-simulation'

/** A deterministic rng that always returns the same value. */
function constantRng(value: number) {
  return () => value
}

function homeOf(scene: VillageScene, id: string): GridPosition {
  const resident = scene.residents.find((r) => r.id === id)
  if (!resident) throw new Error(`no resident ${id}`)
  return resident.home
}

describe('VillageSimulation', () => {
  let scene: VillageScene

  beforeEach(() => {
    scene = makeCozyVillageScene('day')
  })

  describe('initial state', () => {
    it('spawns every resident idle at their home, facing right', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      const actors = sim.snapshot()
      expect(actors).toHaveLength(scene.residents.length)
      for (const actor of actors) {
        expect(actor.position).toEqual(homeOf(scene, actor.id))
        expect(actor.facing).toBe('right')
        expect(actor.action).toBe('idle')
        expect(actor.bubble).toBeNull()
      }
      expect(sim.getDialogue()).toBeNull()
    })

    it('exposes the configured stepMs and defaults to 360', () => {
      expect(new VillageSimulation(scene).stepMs).toBe(360)
      expect(new VillageSimulation(scene, { stepMs: 120 }).stepMs).toBe(120)
    })

    it('returns fresh snapshot objects (no shared position references)', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      const first = sim.snapshot()
      first[0]!.position.x = 999
      expect(sim.snapshot()[0]!.position).toEqual(homeOf(scene, first[0]!.id))
    })
  })

  describe('tick', () => {
    it('sends idle residents into a hop when the roll is low', () => {
      // roll < 0.08 -> hop. Nobody moves off their home cell.
      const sim = new VillageSimulation(scene, { rng: constantRng(0.01) })
      const homes = sim.snapshot().map((a) => ({ ...a.position }))
      sim.tick(1000)
      const actors = sim.snapshot()
      for (let i = 0; i < actors.length; i++) {
        expect(actors[i]!.action).toBe('jump')
        expect(actors[i]!.position).toEqual(homes[i])
      }
    })

    it('a hop returns to idle once its window elapses', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.01) })
      sim.tick(1000) // -> hop until 1900
      expect(sim.snapshot()[0]!.action).toBe('jump')
      sim.tick(2000) // window elapsed -> idle
      expect(sim.snapshot()[0]!.action).toBe('idle')
    })

    it('walks a resident off their home cell toward a chosen target', () => {
      // roll in [0.28, 0.45) picks the "wander toward a neighbor" branch and
      // routes an A* path between two distinct homes.
      const sim = new VillageSimulation(scene, {
        rng: constantRng(0.3),
        stepMs: 10,
      })
      const start = sim.snapshot().map((a) => ({ ...a.position }))
      // First tick plans the walk; later ticks advance a cell each.
      for (const now of [100, 200, 300, 400, 500, 600]) {
        sim.tick(now)
      }
      const moved = sim
        .snapshot()
        .some((actor, i) => !positionsEqual(actor.position, start[i]!))
      expect(moved).toBe(true)
    })
  })

  describe('setScene', () => {
    it('preserves actor positions and plans across a day/night swap', () => {
      const sim = new VillageSimulation(scene, {
        rng: constantRng(0.3),
        stepMs: 10,
      })
      const homes = sim.snapshot().map((a) => ({ ...a.position }))
      // Walk everyone off their home cells first.
      for (const now of [100, 200, 300, 400, 500, 600]) {
        sim.tick(now)
      }
      const before = sim.snapshot()
      expect(
        before.some((actor, i) => !positionsEqual(actor.position, homes[i]!)),
      ).toBe(true)

      sim.setScene(makeCozyVillageScene('night'))

      const after = sim.snapshot()
      expect(after.map((a) => a.position)).toEqual(
        before.map((a) => a.position),
      )
      expect(after.map((a) => a.action)).toEqual(before.map((a) => a.action))
      expect(after.map((a) => a.facing)).toEqual(before.map((a) => a.facing))
    })

    it('is a no-op for the same scene object', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.3) })
      const before = sim.snapshot()
      sim.setScene(scene)
      expect(sim.snapshot()).toEqual(before)
    })

    it('spawns new residents at home and drops removed ones', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      const [keep, drop, ...rest] = scene.residents
      const newcomer = { ...drop!, id: 'newbie', name: 'Newbie' }
      sim.setScene({
        ...scene,
        name: `${scene.name}-reshuffled`,
        residents: [keep!, ...rest, newcomer],
      })
      const actors = sim.snapshot()
      expect(actors.map((a) => a.id)).toEqual([
        keep!.id,
        ...rest.map((r) => r.id),
        'newbie',
      ])
      expect(actors.at(-1)!.position).toEqual(newcomer.home)
    })

    it('keeps an open dialogue with a refreshed resident, closing it if they leave', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      sim.talkTo('poppy', 0)

      const night = makeCozyVillageScene('night')
      sim.setScene(night)
      expect(sim.getDialogue()!.resident).toBe(
        night.residents.find((r) => r.id === 'poppy'),
      )

      sim.setScene({
        ...scene,
        name: `${scene.name}-no-poppy`,
        residents: scene.residents.filter((r) => r.id !== 'poppy'),
      })
      expect(sim.getDialogue()).toBeNull()
    })
  })

  describe('dialogue', () => {
    it('opens a box, freezes the resident, and shows an alert bubble', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      expect(sim.talkTo('poppy', 0)).toBe(true)
      expect(sim.getDialogue()).toEqual({
        resident: expect.objectContaining({ id: 'poppy' }),
        lineIndex: 0,
      })
      const poppy = sim.snapshot().find((a) => a.id === 'poppy')!
      expect(poppy.bubble).toBe('!')
      expect(poppy.action).toBe('idle') // 'talk' plan renders as idle
    })

    it('freezes the talking resident against ticks', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.3) })
      sim.talkTo('poppy', 0)
      const before = sim.snapshot().find((a) => a.id === 'poppy')!.position
      sim.tick(5000)
      const after = sim.snapshot().find((a) => a.id === 'poppy')!.position
      expect(after).toEqual(before)
    })

    it('ignores talkTo while a box is already open', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      sim.talkTo('poppy', 0)
      expect(sim.talkTo('hoot', 0)).toBe(false)
      expect(sim.getDialogue()!.resident.id).toBe('poppy')
    })

    it('ignores unknown or speechless residents', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      expect(sim.talkTo('nobody', 0)).toBe(false)
      expect(sim.getDialogue()).toBeNull()
    })

    it('advances line by line, then closes after the last line', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      sim.talkTo('poppy', 0)
      const lineCount = sim.getDialogue()!.resident.lines.length
      expect(lineCount).toBeGreaterThan(1)
      for (let i = 1; i < lineCount; i++) {
        sim.advanceDialogue(0)
        expect(sim.getDialogue()!.lineIndex).toBe(i)
      }
      sim.advanceDialogue(0) // past the last line
      expect(sim.getDialogue()).toBeNull()
    })

    it('closeDialogue clears the box and releases the resident to idle', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      sim.talkTo('poppy', 0)
      sim.closeDialogue(0)
      expect(sim.getDialogue()).toBeNull()
      expect(sim.snapshot().find((a) => a.id === 'poppy')!.action).toBe('idle')
      // Released: a subsequent tick may now re-plan (no throw, still idle here).
      sim.tick(10)
      expect(sim.getDialogue()).toBeNull()
    })

    it('advanceDialogue with no open box is a no-op', () => {
      const sim = new VillageSimulation(scene, { rng: constantRng(0.5) })
      expect(() => sim.advanceDialogue(0)).not.toThrow()
      expect(sim.getDialogue()).toBeNull()
    })
  })
})
