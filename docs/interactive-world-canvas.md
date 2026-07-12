# Interactive World Canvas

A Pokémon-GBA-style interactive canvas where AI agents live in a cozy pixel
village: each agent has its own house (pod), wanders the map autonomously,
meets neighbors, and produces classic dialogue-box conversations.

This is the first visual layer of the AI to-do app: agents will eventually
represent the user's task assistants, "going to work" and collaborating. For
now the deliverable is the reusable canvas + a showcase scene.

## Packages

Follows the existing **headless core → adapter → React** pattern.

### `@worldkit/tilemap` (headless, tsdown + vitest)

| Module            | Responsibility                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pixel-art.ts`    | Parse string pixel art (`rows` + char→color palette) into RGBA rasters. Pure and unit-tested.                                                    |
| `tileset.ts`      | `TileDef` (16×16, optionally animated) and `PropDef` (multi-tile props with footprint + overhang rows).                                          |
| `tiles/`          | The authored GBA-style art: grass, flowers, tall grass, path, water, tree, houses, rock, sign, fence.                                            |
| `map.ts`          | ASCII map authoring — `parseMap(rows, legend)` → ground layer, props, spawn points. Serializable, testable.                                      |
| `world-bridge.ts` | `mapToWorld(map)` → `@worldkit/world` `World`, so `@worldkit/pathfinding` works unchanged.                                                       |
| `renderer.ts`     | Framework-agnostic Canvas2D renderer: ground canvas + overhang canvas (tree canopies / roofs draw **above** characters), animated water/flowers. |

### `@worldkit/world-canvas` (React, source-only like `sprite-actor`)

| Module                          | Responsibility                                                                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/world-canvas.tsx`   | Composes the tile canvases with DOM `<SpriteActor>` characters. Characters move cell-to-cell with CSS transitions (the GBA walk feel). Click a character to talk. |
| `components/dialogue-box.tsx`   | FireRed-style dialogue: typewriter text, speaker portrait + name plate, blinking ▼, advance on click/key.                                                         |
| `components/speech-bubble.tsx`  | `!`, `?`, `♪`, `…` emote bubbles above characters.                                                                                                                |
| `lib/use-village-simulation.ts` | Autonomous director: per-agent state machine (idle → wander via A\* → chat with neighbor → return home).                                                          |
| `demo/`                         | "Cozy Village" scene: ASCII map with three houses, pond, paths; Pink/Owlet/Dude monster residents with personalities and dialogue lines.                          |

## Sizing model

- Logical cell = **32 world px**.
- Tile art authored at **native 32×32** (tree 32×64, houses 96×96), the
  same pixel density as the 32×32 craftpix character frames — the world
  and its residents share one level of crispness.
- Characters are native **32×32** craftpix frames = exactly one cell.
- The whole stage scales by an integer `zoom` (default 2) with
  `image-rendering: pixelated`.
- Composite typecheck emits declarations to `out-tsc/` (gitignored) so
  `tsdown`'s cleaned `dist/` and `tsc --build` outputs never collide.

## Showcase

- **Storybook**: stories live in the packages (auto-globbed): tileset gallery,
  map renderer, dialogue box, speech bubbles, and the full village scene.
- **Web app**: public `/world` route in `apps/web` renders the village
  full-bleed.

## Later milestones (not in this slice)

- Agents "going to work" (shared building, schedules driven by real task data)
- Pixi renderer adapter for large maps
- Map editor, more tilesets, seasonal palettes
- Mobile app reuse of `@worldkit/world-canvas`
