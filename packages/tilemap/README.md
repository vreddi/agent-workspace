# @worldkit/tilemap

Painterly pixel-art tiles, ASCII map authoring, and a Canvas2D renderer on
top of `@worldkit/world`. Headless except for the renderer — no React. The
art follows the **verdant** style (see
[`docs/verdant-world-engine.md`](../../docs/verdant-world-engine.md)): rich
hue-shifted ramps, textured ground variants, and a day/night lighting engine.

## What's inside

- **`parsePixelArt(rows, palette)`** — string pixel art → RGBA raster, and
  **`CharGrid`** — a programmatic authoring canvas (fills, rects, ellipses)
  that emits the same string art. Tiles are 32×32 native, matching the
  32×32 character sprites 1:1 so the whole world shares one pixel density.
- **`makeVerdantTileset(time)`** — the built-in verdant tileset in a
  `'day'` or `'night'` lighting mood (`timeOfDayAt(date)` picks one from a
  local clock, or drive it with `@worldkit/lighting`). Tiles: grass (with
  hash-picked variants), meadow, tall grass, flowers (animated), fireflies
  (animated — butterflies by day), path, cobble, and water (animated).
  Props: oak, pine, bush, rock, stump, mushrooms, sign, lamp-post (a warm
  flickering light after dark), well, market-stall, and three
  timber-framed cottages (`house-thatch`, `house-slate`, `house-plum`)
  with drifting chimney smoke and windows that light up at night. Both
  moods share ids, so one map parses against either. Themes are data packs
  under `src/themes/` — add a new one without touching the engine.
- **Light emitters & `collectLights(map, tileset)`** — tiles and props can
  declare `LightEmitter`s (lit windows, lamp heads, fireflies); the
  lighting compositor turns them into glowing pools at night.
- **`parseMap(rows, legend, tileset)`** — author maps as ASCII art. Props
  anchor at the bottom-left of their blocking base; markers name cells
  (spawns, doors).
- **`mapToWorld(map, tileset)`** — bridges to a `@worldkit/world` `World`
  so `@worldkit/pathfinding` works unchanged.
- **`TilemapRenderer`** — draws to two canvases: `ground` (below
  characters) and `overhang` (tree canopies and roofs, above characters).
  Call `render(frame)` on a slow tick for the water/flower shimmer.
- **`LightingRenderer`** — the day/night compositor: cast shadows, a
  multiply-blended ambient grade, and additive light glow. Pairs with
  `@worldkit/lighting` for the world clock and sun model.

## Example

```ts
import {
  makeVerdantTileset,
  TilemapRenderer,
  mapToWorld,
  parseMap,
} from '@worldkit/tilemap'

const tileset = makeVerdantTileset('night')
const map = parseMap(
  ['YYYYY', 'Y.*.Y', 'Y.#~Y', 'YYYYY'],
  {
    '.': { kind: 'tile', tile: 'grass' },
    '*': { kind: 'tile', tile: 'flowers' },
    '#': { kind: 'tile', tile: 'path' },
    '~': { kind: 'tile', tile: 'water' },
    Y: { kind: 'prop', prop: 'pine' },
  },
  tileset,
)

const world = mapToWorld(map, tileset) // A*-ready
const renderer = new TilemapRenderer({ map, tileset, ground, overhang })
renderer.render(0)
```

For the React layer (characters, dialogue, autonomous agents) see
`@worldkit/world-canvas`.
