import type { ActionName } from './actions'

export type SpriteStrip = {
  /** Image URL for the horizontal strip. */
  src: string
  /** Number of frames in the strip. */
  frames: number
  /** Playback rate in frames per second. Defaults to the sheet `fps`. */
  fps?: number
  /**
   * Whether the animation loops. If omitted, defaults to `true` for continuous
   * actions (idle/walk/run/etc.) and `false` for one-shot actions
   * (attack/jump/death/etc.) — see `isOneShotAction`.
   */
  loop?: boolean
}

export type SpriteSheet = {
  /** Display name for tooling and stories. */
  name: string
  /** Width of a single frame in pixels. */
  frameWidth: number
  /** Height of a single frame in pixels. */
  frameHeight: number
  /** Default playback FPS for actions that don't specify their own. */
  fps?: number
  /** Optional static portrait image (e.g. for inventory tiles). */
  portrait?: string
  /**
   * The action strips. Any action with a defined strip can be played; any
   * action that is absent is "blank" and will fall through to `fallbackAction`.
   */
  actions: Partial<Record<ActionName, SpriteStrip>>
}

/** True if the sheet has a strip for the given action. */
export function hasAction(sheet: SpriteSheet, action: ActionName): boolean {
  return sheet.actions[action] !== undefined
}

/** The set of actions this sheet can perform, in declaration order. */
export function availableActions(sheet: SpriteSheet): ActionName[] {
  return Object.keys(sheet.actions) as ActionName[]
}
