import * as React from 'react';

import { SpriteActor } from '@worldkit/sprite-actor';
import type { VillageScene } from '#lib/scene';
import {
  useVillageSimulation,
  type UseVillageSimulationOptions,
} from '#lib/use-village-simulation';
import { CELL_SIZE, WorldCanvas } from './world-canvas';
import { DialogueBox } from './dialogue-box';
import { SpeechBubble } from './speech-bubble';

export type VillageCanvasProps = {
  scene: VillageScene;
  /** Integer stage scale. Default 2. */
  zoom?: number;
  simulation?: UseVillageSimulationOptions;
  className?: string;
  style?: React.CSSProperties;
};

// Characters are one cell (32px) but read better sitting slightly high on
// their tile, feet near the bottom edge — the classic GBA offset.
const ACTOR_Y_OFFSET = -6;

/**
 * The full interactive scene: tile map, autonomous residents, emote
 * bubbles, and a dialogue box when the player clicks a character.
 */
export function VillageCanvas({
  scene,
  zoom = 2,
  simulation,
  className,
  style,
}: VillageCanvasProps) {
  const sim = useVillageSimulation(scene, simulation);
  const transition = `left ${sim.stepMs}ms linear, top ${sim.stepMs}ms linear`;

  return (
    <div
      data-slot="village-canvas"
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <WorldCanvas map={scene.map} tileset={scene.tileset} zoom={zoom}>
        {sim.actors.map((actor) => (
          <div
            key={actor.id}
            onClick={(event) => {
              event.stopPropagation();
              sim.talkTo(actor.id);
            }}
            title={`Talk to ${actor.name}`}
            style={{
              position: 'absolute',
              left: actor.position.x * CELL_SIZE,
              top: actor.position.y * CELL_SIZE + ACTOR_Y_OFFSET,
              zIndex: 10 + actor.position.y,
              transition,
              cursor: 'pointer',
            }}
          >
            <SpriteActor
              sheet={actor.resident.sheet}
              action={actor.action}
              facing={actor.facing}
              scale={1}
              aria-label={actor.name}
            />
          </div>
        ))}
        {sim.actors
          .filter((actor) => actor.bubble)
          .map((actor) => (
            <div
              key={`bubble-${actor.id}`}
              style={{
                position: 'absolute',
                left: actor.position.x * CELL_SIZE + CELL_SIZE / 2,
                top: actor.position.y * CELL_SIZE - 24,
                zIndex: 1000,
                transform: 'translateX(-50%)',
                transition,
                pointerEvents: 'none',
              }}
            >
              <SpeechBubble>{actor.bubble}</SpeechBubble>
            </div>
          ))}
      </WorldCanvas>
      {sim.dialogue ? (
        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
            zIndex: 2000,
          }}
        >
          <DialogueBox
            speaker={sim.dialogue.resident.name}
            portrait={sim.dialogue.resident.sheet.portrait}
            text={sim.dialogue.resident.lines[sim.dialogue.lineIndex]!}
            onAdvance={sim.advanceDialogue}
          />
        </div>
      ) : null}
    </div>
  );
}
