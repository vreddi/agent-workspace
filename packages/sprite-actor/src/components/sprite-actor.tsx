import * as React from 'react'

import { isOneShotAction, type ActionName } from '#lib/actions'
import {
  hasAction,
  type SpriteSheet,
  type SpriteStrip,
} from '#lib/sprite-sheet'
import { useSpriteAnimation } from '#lib/use-sprite-animation'

export type SpriteActorProps = {
  /** The character's sprite sheet. */
  sheet: SpriteSheet
  /** Action to play. Falls back to `fallbackAction` if the sheet has no strip for it. */
  action?: ActionName
  /** Facing direction. `'left'` mirrors horizontally. */
  facing?: 'left' | 'right'
  /** Integer scale factor (1 = native pixel size). */
  scale?: number
  /** Override fps for the current action. */
  fps?: number
  /** Force loop/no-loop for the current action. */
  loop?: boolean
  /** Freeze on the current frame. */
  paused?: boolean
  /** What to play when `action` has no strip in the sheet. Defaults to `'idle'`. */
  fallbackAction?: ActionName
  /** Render pixel-perfect (nearest-neighbor) scaling. Defaults to true. */
  pixelated?: boolean
  /** Fired when a one-shot animation finishes. */
  onActionComplete?: (action: ActionName) => void
  /** Fired on every frame advance. */
  onFrame?: (frame: number, action: ActionName) => void
  className?: string
  style?: React.CSSProperties
  /** Optional ARIA label (defaults to "<sheet.name> <action>"). */
  'aria-label'?: string
}

const DEFAULT_FPS = 8

type ResolvedAction = {
  action: ActionName
  strip: SpriteStrip
}

function resolveAction(
  sheet: SpriteSheet,
  desired: ActionName | undefined,
  fallback: ActionName,
): ResolvedAction | null {
  if (desired && hasAction(sheet, desired)) {
    return { action: desired, strip: sheet.actions[desired]! }
  }
  if (hasAction(sheet, fallback)) {
    return { action: fallback, strip: sheet.actions[fallback]! }
  }
  // last-ditch: pick any defined action so we render something
  const any = Object.keys(sheet.actions)[0] as ActionName | undefined
  if (any) return { action: any, strip: sheet.actions[any]! }
  return null
}

export function SpriteActor({
  sheet,
  action,
  facing = 'right',
  scale = 2,
  fps,
  loop,
  paused = false,
  fallbackAction = 'idle',
  pixelated = true,
  onActionComplete,
  onFrame,
  className,
  style,
  'aria-label': ariaLabel,
}: SpriteActorProps) {
  const resolved = resolveAction(sheet, action, fallbackAction)

  const resolvedAction = resolved?.action ?? fallbackAction
  const strip = resolved?.strip
  const frameCount = strip?.frames ?? 1
  const stripFps = fps ?? strip?.fps ?? sheet.fps ?? DEFAULT_FPS
  const stripLoop =
    loop ?? strip?.loop ?? (resolved ? !isOneShotAction(resolved.action) : true)

  const frame = useSpriteAnimation({
    frames: frameCount,
    fps: stripFps,
    loop: stripLoop,
    paused: paused || !strip,
    resetKey: `${strip?.src ?? 'none'}::${resolvedAction}`,
    onFrame: React.useCallback(
      (f: number) => onFrame?.(f, resolvedAction),
      [onFrame, resolvedAction],
    ),
    onComplete: React.useCallback(
      () => onActionComplete?.(resolvedAction),
      [onActionComplete, resolvedAction],
    ),
  })

  const w = sheet.frameWidth * scale
  const h = sheet.frameHeight * scale

  const visualStyle: React.CSSProperties = strip
    ? {
        width: w,
        height: h,
        backgroundImage: `url(${strip.src})`,
        backgroundPosition: `${-frame * w}px 0`,
        backgroundSize: `${strip.frames * w}px ${h}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: pixelated ? 'pixelated' : undefined,
        transform: facing === 'left' ? 'scaleX(-1)' : undefined,
        transformOrigin: 'center',
      }
    : {
        width: w,
        height: h,
        outline: '1px dashed currentColor',
        opacity: 0.4,
      }

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `${sheet.name} ${resolvedAction}`}
      data-slot="sprite-actor"
      data-action={resolvedAction}
      data-has-action={!!resolved}
      data-facing={facing}
      className={className}
      style={{
        display: 'inline-block',
        lineHeight: 0,
        ...visualStyle,
        ...style,
      }}
    />
  )
}
