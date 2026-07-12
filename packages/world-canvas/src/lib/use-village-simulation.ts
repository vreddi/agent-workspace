import * as React from 'react';

import type { VillageScene } from './scene';
import { VillageSimulation as VillageSimulationEngine } from './village-simulation';
import type {
  ActorSnapshot,
  DialogueState,
} from './village-simulation';

export type {
  ActorSnapshot,
  BubbleKind,
  DialogueState,
} from './village-simulation';

export type UseVillageSimulationOptions = {
  /** Milliseconds per walked cell. Default 360 (the GBA stroll). */
  stepMs?: number;
  /** Pause all autonomous behavior (used by stories). */
  paused?: boolean;
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

const TICK_MS = 100;

/**
 * React binding for the headless {@link VillageSimulationEngine}. This hook
 * owns only the clock (a `setInterval` ticking the engine) and the React
 * state mirrors; all the autonomous-village behavior lives in the engine so
 * it can be tested without React.
 */
export function useVillageSimulation(
  scene: VillageScene,
  options: UseVillageSimulationOptions = {},
): VillageSimulation {
  const stepMs = options.stepMs ?? 360;
  const paused = options.paused ?? false;

  const engine = React.useMemo(
    () => new VillageSimulationEngine(scene, { stepMs }),
    [scene, stepMs],
  );

  const [snapshot, setSnapshot] = React.useState<ActorSnapshot[]>(() =>
    engine.snapshot(),
  );
  const [dialogue, setDialogue] = React.useState<DialogueState | null>(() =>
    engine.getDialogue(),
  );

  // Resync React state whenever a fresh engine takes over (scene/stepMs change).
  React.useEffect(() => {
    setSnapshot(engine.snapshot());
    setDialogue(engine.getDialogue());
  }, [engine]);

  React.useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(() => {
      engine.tick(performance.now());
      setSnapshot(engine.snapshot());
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [engine, paused]);

  const talkTo = React.useCallback(
    (residentId: string) => {
      if (engine.talkTo(residentId, performance.now())) {
        setSnapshot(engine.snapshot());
        setDialogue(engine.getDialogue());
      }
    },
    [engine],
  );

  const closeDialogue = React.useCallback(() => {
    engine.closeDialogue(performance.now());
    setSnapshot(engine.snapshot());
    setDialogue(engine.getDialogue());
  }, [engine]);

  const advanceDialogue = React.useCallback(() => {
    engine.advanceDialogue(performance.now());
    setDialogue(engine.getDialogue());
  }, [engine]);

  return {
    actors: snapshot,
    stepMs,
    dialogue,
    talkTo,
    advanceDialogue,
    closeDialogue,
  };
}
