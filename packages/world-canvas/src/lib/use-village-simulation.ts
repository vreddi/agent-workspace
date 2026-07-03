import * as React from 'react';

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

export type VillageSimulation = {
  actors: ActorSnapshot[];
  /** Milliseconds an actor takes to walk one cell (for CSS transitions). */
  stepMs: number;
  dialogue: DialogueState | null;
  /** Opens the dialogue box for a resident (no-op while one is open). */
  talkTo: (residentId: string) => void;
  /** Shows the next line, or closes the box after the last one. */
  advanceDialogue: () => void;
  closeDialogue: () => void;
};

export type UseVillageSimulationOptions = {
  /** Milliseconds per walked cell. Default 360 (the GBA stroll). */
  stepMs?: number;
  /** Pause all autonomous behavior (used by stories). */
  paused?: boolean;
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

const TICK_MS = 100;
const CHAT_BUBBLES: BubbleKind[] = ['♪', '…', '?', '♥'];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function actionFor(plan: Plan): ActionName {
  switch (plan.kind) {
    case 'walk':
      return 'walk';
    case 'hop':
      return 'jump';
    default:
      return 'idle';
  }
}

/**
 * The autonomous village director. Residents idle around their homes, pick
 * strolls via A*, bump into each other for a chat, occasionally hop on the
 * spot, and stop everything to talk when the player clicks them.
 */
export function useVillageSimulation(
  scene: VillageScene,
  options: UseVillageSimulationOptions = {},
): VillageSimulation {
  const stepMs = options.stepMs ?? 360;
  const paused = options.paused ?? false;

  const world = React.useMemo<World>(
    () => mapToWorld(scene.map, scene.tileset, { id: scene.name }),
    [scene],
  );

  const actorsRef = React.useRef<SimActor[] | null>(null);
  if (actorsRef.current === null) {
    actorsRef.current = scene.residents.map((resident) => ({
      resident,
      position: { ...resident.home },
      facing: 'right',
      plan: { kind: 'idle', until: 0 },
      bubble: null,
    }));
  }

  const [snapshot, setSnapshot] = React.useState<ActorSnapshot[]>(() =>
    toSnapshots(actorsRef.current!),
  );
  const [dialogue, setDialogue] = React.useState<DialogueState | null>(null);
  const dialogueRef = React.useRef(dialogue);
  dialogueRef.current = dialogue;

  React.useEffect(() => {
    if (paused) return;
    const actors = actorsRef.current!;

    const occupied = (cell: GridPosition, except: SimActor): boolean =>
      actors.some(
        (actor) => actor !== except && positionsEqual(actor.position, cell),
      );

    const randomWalkableCell = (): GridPosition | null => {
      for (let attempt = 0; attempt < 12; attempt++) {
        const cell = {
          x: Math.floor(Math.random() * scene.map.width),
          y: Math.floor(Math.random() * scene.map.height),
          z: 0,
        };
        if (!isCellBlocked(world, cell)) return cell;
      }
      return null;
    };

    const startWalk = (actor: SimActor, target: GridPosition): void => {
      const path = findPath(world, actor.position, target);
      if (!path || path.length < 2) {
        actor.plan = { kind: 'idle', until: performance.now() + 1000 };
        return;
      }
      actor.plan = {
        kind: 'walk',
        path,
        step: 0,
        nextStepAt: performance.now() + stepMs,
      };
    };

    const faceTowards = (actor: SimActor, target: GridPosition): void => {
      if (target.x !== actor.position.x) {
        actor.facing = target.x > actor.position.x ? 'right' : 'left';
      }
    };

    const decide = (actor: SimActor, now: number): void => {
      const roll = Math.random();
      if (roll < 0.08) {
        actor.plan = { kind: 'hop', until: now + 900 };
        return;
      }
      if (roll < 0.28) {
        // Head home for a bit.
        startWalk(actor, actor.resident.home);
        return;
      }
      if (roll < 0.45) {
        // Wander over toward a neighbor.
        const others = actors.filter((other) => other !== actor);
        if (others.length > 0) {
          startWalk(actor, pick(others).position);
          return;
        }
      }
      const target = randomWalkableCell();
      if (target) {
        startWalk(actor, target);
        return;
      }
      actor.plan = { kind: 'idle', until: now + randomBetween(800, 2400) };
    };

    const maybeChat = (actor: SimActor, now: number): void => {
      if (actor.plan.kind !== 'idle') return;
      for (const other of actors) {
        if (other === actor || other.plan.kind !== 'idle') continue;
        if (manhattanDistance(actor.position, other.position) > 1) continue;
        if (Math.random() > 0.4) continue;
        const until = now + randomBetween(2600, 4600);
        actor.plan = { kind: 'chat', partnerId: other.resident.id, until };
        other.plan = { kind: 'chat', partnerId: actor.resident.id, until };
        faceTowards(actor, other.position);
        faceTowards(other, actor.position);
        actor.bubble = { kind: pick(CHAT_BUBBLES), until: now + 1600 };
        other.bubble = {
          kind: pick(CHAT_BUBBLES),
          until: now + 3000,
        };
        return;
      }
    };

    const tick = (): void => {
      const now = performance.now();
      for (const actor of actors) {
        if (actor.bubble && actor.bubble.until <= now) {
          actor.bubble = null;
        }
        const plan = actor.plan;
        switch (plan.kind) {
          case 'talk':
            break; // frozen while the dialogue box is open
          case 'idle':
            if (plan.until <= now) {
              decide(actor, now);
            } else {
              maybeChat(actor, now);
            }
            break;
          case 'hop':
          case 'chat':
            if (plan.until <= now) {
              actor.plan = {
                kind: 'idle',
                until: now + randomBetween(600, 2000),
              };
            }
            break;
          case 'walk': {
            if (plan.nextStepAt > now) break;
            const next = plan.path[plan.step + 1];
            if (!next || occupied(next, actor)) {
              // Path finished or someone is in the way: settle down.
              actor.plan = {
                kind: 'idle',
                until: now + randomBetween(1200, 3600),
              };
              break;
            }
            faceTowards(actor, next);
            actor.position = { ...next };
            plan.step += 1;
            plan.nextStepAt = now + stepMs;
            if (plan.step >= plan.path.length - 1) {
              actor.plan = {
                kind: 'idle',
                until: now + randomBetween(1200, 3600),
              };
            }
            break;
          }
        }
      }
      setSnapshot(toSnapshots(actors));
    };

    const interval = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(interval);
  }, [world, scene, stepMs, paused]);

  const talkTo = React.useCallback(
    (residentId: string) => {
      if (dialogueRef.current) return;
      const actors = actorsRef.current!;
      const actor = actors.find((a) => a.resident.id === residentId);
      if (!actor || actor.resident.lines.length === 0) return;
      actor.plan = { kind: 'talk' };
      actor.bubble = { kind: '!', until: performance.now() + 1200 };
      setSnapshot(toSnapshots(actors));
      setDialogue({ resident: actor.resident, lineIndex: 0 });
    },
    [],
  );

  const closeDialogue = React.useCallback(() => {
    const actors = actorsRef.current!;
    for (const actor of actors) {
      if (actor.plan.kind === 'talk') {
        actor.plan = {
          kind: 'idle',
          until: performance.now() + randomBetween(800, 2000),
        };
      }
    }
    setSnapshot(toSnapshots(actors));
    setDialogue(null);
  }, []);

  const advanceDialogue = React.useCallback(() => {
    const current = dialogueRef.current;
    if (!current) return;
    if (current.lineIndex + 1 < current.resident.lines.length) {
      setDialogue({ ...current, lineIndex: current.lineIndex + 1 });
    } else {
      closeDialogue();
    }
  }, [closeDialogue]);

  return {
    actors: snapshot,
    stepMs,
    dialogue,
    talkTo,
    advanceDialogue,
    closeDialogue,
  };
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
