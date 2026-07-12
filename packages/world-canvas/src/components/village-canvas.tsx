import * as React from 'react'

import { ambientAt, lightLevelAt, shadowAt } from '@worldkit/lighting'
import { SpriteActor } from '@worldkit/sprite-actor'
import type { VillageScene } from '#lib/scene'
import {
  useVillageSimulation,
  type UseVillageSimulationOptions,
} from '#lib/use-village-simulation'
import { CELL_SIZE, WorldCanvas } from './world-canvas'
import type { WorldCanvasLighting } from './world-canvas'
import { DialogueBox } from './dialogue-box'
import { SpeechBubble } from './speech-bubble'

export type VillageCanvasProps = {
  scene: VillageScene
  /** Integer stage scale. Default 2. */
  zoom?: number
  /**
   * Time of day in [0, 24). When provided, the scene is graded for day/night
   * (ambient tint, lamp glow, cast + character shadows). Omit for flat day.
   */
  hour?: number
  simulation?: UseVillageSimulationOptions
  className?: string
  style?: React.CSSProperties
}

// Characters are one cell (32px) but read better sitting slightly high on
// their tile, feet near the bottom edge — the classic top-down offset.
const ACTOR_Y_OFFSET = -6

// Soft blob beneath each character, in world pixels at zoom 1.
const ACTOR_SHADOW_W = 24
const ACTOR_SHADOW_H = 8
const NIGHT_SHADOW_ALPHA = 0.18

/**
 * The full interactive scene: tile map, autonomous residents, emote
 * bubbles, and a dialogue box when the player clicks a character.
 */
export function VillageCanvas({
  scene,
  zoom = 2,
  hour,
  simulation,
  className,
  style,
}: VillageCanvasProps) {
  const sim = useVillageSimulation(scene, simulation)
  const transition = `left ${sim.stepMs}ms linear, top ${sim.stepMs}ms linear`

  const lighting = React.useMemo<WorldCanvasLighting | undefined>(
    () =>
      hour == null
        ? undefined
        : {
            ambient: ambientAt(hour),
            shadow: shadowAt(hour),
            lightLevel: lightLevelAt(hour),
          },
    [hour],
  )
  const sunShadow = lighting?.shadow ?? null
  // Character shadow: leans/stretches with the sun, or a faint static blob at
  // night. `background`/`transform` describe the blob; only rendered when the
  // scene is graded (hour provided).
  const actorShadowBg = (alpha: number): string =>
    `radial-gradient(closest-side, rgba(26, 20, 51, ${alpha}), transparent)`
  const actorShadowStyle: React.CSSProperties = sunShadow
    ? {
        background: actorShadowBg(sunShadow.alpha),
        transform: `translateX(-50%) translateX(${sunShadow.skewX * 6}px) scaleX(${1 + Math.abs(sunShadow.skewX) * 0.5})`,
      }
    : {
        background: actorShadowBg(NIGHT_SHADOW_ALPHA),
        transform: 'translateX(-50%)',
      }

  return (
    <div
      data-slot="village-canvas"
      className={className}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <WorldCanvas
        map={scene.map}
        tileset={scene.tileset}
        zoom={zoom}
        lighting={lighting}
      >
        {lighting
          ? sim.actors.map((actor) => (
              <div
                key={`shadow-${actor.id}`}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: actor.position.x * CELL_SIZE + CELL_SIZE / 2,
                  top:
                    actor.position.y * CELL_SIZE + CELL_SIZE - ACTOR_SHADOW_H,
                  width: ACTOR_SHADOW_W,
                  height: ACTOR_SHADOW_H,
                  zIndex: 9 + actor.position.y,
                  transformOrigin: 'center',
                  transition,
                  pointerEvents: 'none',
                  ...actorShadowStyle,
                }}
              />
            ))
          : null}
        {sim.actors.map((actor) => (
          <div
            key={actor.id}
            onClick={(event) => {
              event.stopPropagation()
              sim.talkTo(actor.id)
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
  )
}
