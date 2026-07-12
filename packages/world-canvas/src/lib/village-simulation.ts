import { positionsEqual } from '@worldkit/grid';
import type { GridPosition } from '@worldkit/grid';
import { findPath, manhattanDistance } from '@worldkit/pathfinding';
import type { ActionName } from '@worldkit/sprite-actor';
import { mapToWorld } from '@worldkit/tilemap';
import { isCellBlocked } from '@worldkit/world';
import type { World } from '@worldkit/world';
import type { Resident, VillageScene } from './scene';

export type BubbleKind = '!' | '?' | '…' | '♪' | '♥';

export type ActorSnapshot = {
  id: string;
  name: string;
  resident: Resident;
  position: GridPosition;
  facing: 'left' | 'right';
  action: ActionName;
  bubble: BubbleKind | null;
};

export type DialogueState = {
  resident: Resident;
  lineIndex: number;
};

/** Injectable source of randomness in `[0, 1)` (defaults to `Math.random`). */
export type Rng = () => number;

export type VillageSimulationOptions = {
  /** Milliseconds per walked cell. Default 360 (the GBA stroll). */
  stepMs?: number;
  /** Randomness source. Injected so simulations can be made deterministic. */
  rng?: Rng;
};

type Plan =
  | { kind: 'idle'; until: number }
  | { kind: 'walk'; path: GridPosition[]; step: number; nextStepAt: number }
  | { kind: 'chat'; partnerId: string; until: number }
  | { kind: 'hop'; until: number }
  | { kind: 'talk' };

type SimActor = {
  resident: Resident;
  position: GridPosition;
  facing: 'left' | 'right';
  plan: Plan;
  bubble: { kind: BubbleKind; until: number } | null;
};

const CHAT_BUBBLES: BubbleKind[] = ['♪', '…', '?', '♥'];

export function actionFor(plan: Plan): ActionName {
  switch (plan.kind) {
    case 'walk':
      return 'walk';
    case 'hop':
      return 'jump';
    default:
      return 'idle';
  }
}

function toSnapshots(actors: SimActor[]): ActorSnapshot[] {
  return actors.map((actor) => ({
    id: actor.resident.id,
    name: actor.resident.name,
    resident: actor.resident,
    position: { ...actor.position },
    facing: actor.facing,
    action: actionFor(actor.plan),
    bubble: actor.bubble?.kind ?? null,
  }));
}

/**
 * The autonomous village director, extracted from React. Residents idle
 * around their homes, pick strolls via A*, bump into each other for a chat,
 * occasionally hop on the spot, and stop everything to talk when asked.
 *
 * This is plain, headless simulation logic: no rendering, no React, and time
 * (`now`) plus randomness (`rng`) are injected so it can be driven and
 * asserted deterministically in tests. The `useVillageSimulation` hook is a
 * thin wrapper that owns the clock and React state.
 */
export class VillageSimulation {
  /** Milliseconds per walked cell. Mutable so a live scene can retime. */
  stepMs: number;

  private scene: VillageScene;
  private world: World;
  private readonly rng: Rng;
  private actors: SimActor[];
  private dialogue: DialogueState | null = null;

  constructor(scene: VillageScene, options: VillageSimulationOptions = {}) {
    this.scene = scene;
    this.stepMs = options.stepMs ?? 360;
    this.rng = options.rng ?? Math.random;
    this.world = mapToWorld(scene.map, scene.tileset, { id: scene.name });
    this.actors = scene.residents.map((resident) => ({
      resident,
      position: { ...resident.home },
      facing: 'right',
      plan: { kind: 'idle', until: 0 },
      bubble: null,
    }));
  }

  /**
   * Swaps in a new scene without resetting the village. Scene identity
   * changes at runtime — day/night lighting mints a new scene object at
   * dawn/dusk, and the office rebuilds its scene whenever the agent list
   * updates — so residents that persist keep their position, plan, facing,
   * and bubble (matched by resident id, with the resident reference
   * refreshed). New residents spawn at their home; removed ones leave, and
   * an open dialogue with a removed resident closes.
   */
  setScene(scene: VillageScene): void {
    if (scene === this.scene) return;
    this.scene = scene;
    this.world = mapToWorld(scene.map, scene.tileset, { id: scene.name });
    const existing = new Map(
      this.actors.map((actor) => [actor.resident.id, actor]),
    );
    this.actors = scene.residents.map((resident) => {
      const actor = existing.get(resident.id);
      if (actor) {
        actor.resident = resident;
        return actor;
      }
      return {
        resident,
        position: { ...resident.home },
        facing: 'right' as const,
        plan: { kind: 'idle' as const, until: 0 },
        bubble: null,
      };
    });
    if (this.dialogue) {
      const resident = scene.residents.find(
        (r) => r.id === this.dialogue!.resident.id,
      );
      if (!resident || this.dialogue.lineIndex >= resident.lines.length) {
        this.dialogue = null;
      } else {
        this.dialogue = { ...this.dialogue, resident };
      }
    }
  }

  /** A render-ready view of every actor. */
  snapshot(): ActorSnapshot[] {
    return toSnapshots(this.actors);
  }

  /** The open dialogue, or `null` when no box is showing. */
  getDialogue(): DialogueState | null {
    return this.dialogue;
  }

  private randomBetween(min: number, max: number): number {
    return min + this.rng() * (max - min);
  }

  private pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.rng() * items.length)]!;
  }

  private occupied(cell: GridPosition, except: SimActor): boolean {
    return this.actors.some(
      (actor) => actor !== except && positionsEqual(actor.position, cell),
    );
  }

  private randomWalkableCell(): GridPosition | null {
    for (let attempt = 0; attempt < 12; attempt++) {
      const cell = {
        x: Math.floor(this.rng() * this.scene.map.width),
        y: Math.floor(this.rng() * this.scene.map.height),
        z: 0,
      };
      if (!isCellBlocked(this.world, cell)) return cell;
    }
    return null;
  }

  private startWalk(actor: SimActor, target: GridPosition, now: number): void {
    const path = findPath(this.world, actor.position, target);
    if (!path || path.length < 2) {
      actor.plan = { kind: 'idle', until: now + 1000 };
      return;
    }
    actor.plan = {
      kind: 'walk',
      path,
      step: 0,
      nextStepAt: now + this.stepMs,
    };
  }

  private faceTowards(actor: SimActor, target: GridPosition): void {
    if (target.x !== actor.position.x) {
      actor.facing = target.x > actor.position.x ? 'right' : 'left';
    }
  }

  private decide(actor: SimActor, now: number): void {
    const roll = this.rng();
    if (roll < 0.08) {
      actor.plan = { kind: 'hop', until: now + 900 };
      return;
    }
    if (roll < 0.28) {
      // Head home for a bit.
      this.startWalk(actor, actor.resident.home, now);
      return;
    }
    if (roll < 0.45) {
      // Wander over toward a neighbor.
      const others = this.actors.filter((other) => other !== actor);
      if (others.length > 0) {
        this.startWalk(actor, this.pick(others).position, now);
        return;
      }
    }
    const target = this.randomWalkableCell();
    if (target) {
      this.startWalk(actor, target, now);
      return;
    }
    actor.plan = { kind: 'idle', until: now + this.randomBetween(800, 2400) };
  }

  private maybeChat(actor: SimActor, now: number): void {
    if (actor.plan.kind !== 'idle') return;
    for (const other of this.actors) {
      if (other === actor || other.plan.kind !== 'idle') continue;
      if (manhattanDistance(actor.position, other.position) > 1) continue;
      if (this.rng() > 0.4) continue;
      const until = now + this.randomBetween(2600, 4600);
      actor.plan = { kind: 'chat', partnerId: other.resident.id, until };
      other.plan = { kind: 'chat', partnerId: actor.resident.id, until };
      this.faceTowards(actor, other.position);
      this.faceTowards(other, actor.position);
      actor.bubble = { kind: this.pick(CHAT_BUBBLES), until: now + 1600 };
      other.bubble = { kind: this.pick(CHAT_BUBBLES), until: now + 3000 };
      return;
    }
  }

  /** Advances every actor by one simulation step at wall-clock time `now`. */
  tick(now: number): void {
    for (const actor of this.actors) {
      if (actor.bubble && actor.bubble.until <= now) {
        actor.bubble = null;
      }
      const plan = actor.plan;
      switch (plan.kind) {
        case 'talk':
          break; // frozen while the dialogue box is open
        case 'idle':
          if (plan.until <= now) {
            this.decide(actor, now);
          } else {
            this.maybeChat(actor, now);
          }
          break;
        case 'hop':
        case 'chat':
          if (plan.until <= now) {
            actor.plan = {
              kind: 'idle',
              until: now + this.randomBetween(600, 2000),
            };
          }
          break;
        case 'walk': {
          if (plan.nextStepAt > now) break;
          const next = plan.path[plan.step + 1];
          if (!next || this.occupied(next, actor)) {
            // Path finished or someone is in the way: settle down.
            actor.plan = {
              kind: 'idle',
              until: now + this.randomBetween(1200, 3600),
            };
            break;
          }
          this.faceTowards(actor, next);
          actor.position = { ...next };
          plan.step += 1;
          plan.nextStepAt = now + this.stepMs;
          if (plan.step >= plan.path.length - 1) {
            actor.plan = {
              kind: 'idle',
              until: now + this.randomBetween(1200, 3600),
            };
          }
          break;
        }
      }
    }
  }

  /**
   * Opens the dialogue box for a resident and freezes them. No-op while a
   * box is already open, or for an unknown / speechless resident. Returns
   * whether a box was opened.
   */
  talkTo(residentId: string, now: number): boolean {
    if (this.dialogue) return false;
    const actor = this.actors.find((a) => a.resident.id === residentId);
    if (!actor || actor.resident.lines.length === 0) return false;
    actor.plan = { kind: 'talk' };
    actor.bubble = { kind: '!', until: now + 1200 };
    this.dialogue = { resident: actor.resident, lineIndex: 0 };
    return true;
  }

  /** Shows the next line, or closes the box after the last one. */
  advanceDialogue(now: number): void {
    const current = this.dialogue;
    if (!current) return;
    if (current.lineIndex + 1 < current.resident.lines.length) {
      this.dialogue = { ...current, lineIndex: current.lineIndex + 1 };
    } else {
      this.closeDialogue(now);
    }
  }

  /** Closes any open box and releases the frozen actor back to idling. */
  closeDialogue(now: number): void {
    for (const actor of this.actors) {
      if (actor.plan.kind === 'talk') {
        actor.plan = {
          kind: 'idle',
          until: now + this.randomBetween(800, 2000),
        };
      }
    }
    this.dialogue = null;
  }
}
