# @worldkit/sprite-actor

A fully controllable sprite-sheet character component for 2D worlds.

```tsx
import { SpriteActor } from '@worldkit/sprite-actor'
import { PinkMonsterSheet } from '@worldkit/sprite-actor/examples'
;<SpriteActor sheet={PinkMonsterSheet} action="run" facing="left" scale={4} />
```

## What it does

- One `<SpriteActor />` per character.
- You feed it a `SpriteSheet` config that maps **action names** to horizontal
  sprite strips.
- The component knows about a large set of named actions (movement, combat,
  states, emotes, interaction, and jobs — see `ALL_ACTIONS`). Whichever ones
  your sheet defines, you can play. Anything else is "blank" and falls back
  gracefully to `fallbackAction` (default `idle`).
- One-shot actions (attack, jump, death, etc.) play once and stop on the last
  frame, firing `onActionComplete`. Looping actions cycle forever.
- Crisp pixel art by default (`image-rendering: pixelated`) and easy horizontal
  flipping for facing direction.

## Defining a sprite sheet

```ts
import type { SpriteSheet } from '@worldkit/sprite-actor'

export const MyHero: SpriteSheet = {
  name: 'My Hero',
  frameWidth: 32,
  frameHeight: 32,
  fps: 8,
  actions: {
    idle: { src: '/sprites/hero/idle.png', frames: 4 },
    walk: { src: '/sprites/hero/walk.png', frames: 6 },
    attack1: { src: '/sprites/hero/attack.png', frames: 4, fps: 12 },
    // Any action listed in ALL_ACTIONS can go here. The rest are blank.
  },
}
```

## Example characters

The package ships with three ready-to-use example characters built from
the [Craftpix Tiny Hero](https://craftpix.net) pack — Pink, Owlet, and Dude
Monster — each with 12 action strips:

```ts
import {
  PinkMonsterSheet,
  OwletMonsterSheet,
  DudeMonsterSheet,
} from '@worldkit/sprite-actor/examples'
```

See the **World/SpriteActor** stories in Storybook for live demos.
