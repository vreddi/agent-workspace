import type { SpriteSheet } from '@worldkit/sprite-actor'
import {
  DudeMonsterSheet,
  OwletMonsterSheet,
  PinkMonsterSheet,
} from '@worldkit/sprite-actor/examples'

/** Built-in sprite sheets a new agent can pick instead of uploading one. */
export type StubSprite = {
  id: string
  label: string
  sheet: SpriteSheet
}

export const STUB_SPRITES: StubSprite[] = [
  { id: 'pink-monster', label: 'Pink', sheet: PinkMonsterSheet },
  { id: 'owlet-monster', label: 'Owlet', sheet: OwletMonsterSheet },
  { id: 'dude-monster', label: 'Dude', sheet: DudeMonsterSheet },
]

export function stubSheet(stubId: string): SpriteSheet | null {
  return STUB_SPRITES.find((s) => s.id === stubId)?.sheet ?? null
}

/**
 * Wrap an uploaded image as a minimal sprite sheet: square frames sized by
 * the image height, the whole strip treated as the idle loop.
 */
export function customSheet(sheetUrl: string, frameSize: number, frames: number): SpriteSheet {
  return {
    name: 'Custom sprite',
    frameWidth: frameSize,
    frameHeight: frameSize,
    fps: 8,
    actions: {
      idle: { src: sheetUrl, frames },
    },
  }
}
