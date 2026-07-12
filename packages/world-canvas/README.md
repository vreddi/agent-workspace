# @worldkit/world-canvas

Painterly interactive world canvas for React: tile maps from
`@worldkit/tilemap` (the verdant style), characters from
`@worldkit/sprite-actor`, autonomous wandering via `@worldkit/pathfinding`,
a day/night lighting grade from `@worldkit/lighting`, and dialogue boxes.

## Components

- **`<VillageCanvas scene={...} />`** — the full experience. Residents
  idle, stroll (A\* pathfinding, cell-to-cell CSS transitions), hop, meet
  neighbors for emote-bubble chats, and return home. Click a character to
  open its dialogue box; advance with click or Enter/Space.
- **`<WorldCanvas map tileset zoom>`** — just the stage: ground canvas,
  a children slot for sprites, and the overhang canvas (tree canopies and
  roofs draw above characters). Characters get `zIndex: 10 + cellY`;
  floating UI `zIndex >= 1000`.
- **`<DialogueBox text speaker portrait onAdvance />`** — retro dialogue:
  typewriter text, name plate, pixelated portrait, bobbing ▼.
- **`useWorldClock(options?)`** — a live day/night clock; pass its `hour`
  to `VillageCanvas` to grade the scene (ambient tint, cast shadows, lit
  windows and lamps at night).
- **`<SpeechBubble>!</SpeechBubble>`** — emote bubbles (`! ? … ♪ ♥`).
- **`useVillageSimulation(scene)`** — the autonomous director, exposed
  separately for custom layouts.

## Quick start

```tsx
import { VillageCanvas, useWorldClock } from '@worldkit/world-canvas'
import { makeBoroughScene } from '@worldkit/world-canvas/demo'

export function AgentsAtPlay() {
  const clock = useWorldClock()
  const scene = makeBoroughScene(clock.artMood)
  return <VillageCanvas scene={scene} zoom={2} hour={clock.hour} />
}
```

Scenes are plain data (`VillageScene`): a parsed `TileMap`, a tileset, and
residents (`id`, `name`, sprite `sheet`, `home` cell, dialogue `lines`).
Author your own map with `parseMap` from `@worldkit/tilemap`.

## Notes

- Cells are 32px at zoom 1: tile art and character frames are both native
  32×32 — one character per cell at a single shared pixel density, so the
  world is as crisp as the sprites.
- The simulation is deliberately headless-ish: it only needs a scene, so
  future milestones (agents "going to work" from real task data) swap the
  director without touching rendering.
