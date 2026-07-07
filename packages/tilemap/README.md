# @worldkit/tilemap

GBA-style pixel-art tiles, ASCII map authoring, and a Canvas2D renderer on
top of `@worldkit/world`. Headless except for the renderer — no React.

## What's inside

- **`parsePixelArt(rows, palette)`** — string pixel art → RGBA raster, and
  **`CharGrid`** — a programmatic authoring canvas (fills, rects, ellipses)
  that emits the same string art. Tiles are 32×32 native, matching the
  32×32 character sprites 1:1 so the whole world shares one pixel density.
- **`makeCozyTileset(time)`** — the built-in village tileset in a `'day'`
  or `'night'` lighting mood (`timeOfDayAt(date)` picks one from a local
  clock; `COZY_TILESET` is the night set). Tiles: mossy grass, meadow,
  tall grass, flowers (animated), fireflies (animated — butterflies by
  day), path, and water (animated). Props: tree, pine, autumn bush,
  lantern (glowing and flickering at night), rock, stump, mushrooms,
  sign, and three timber-cabin variants (`house-moss`, `house-slate`,
  `house-rust`) with drifting chimney smoke and windows that light up
  after dark. Both moods share ids, so one map parses against either.
- **`parseMap(rows, legend, tileset)`** — author maps as ASCII art. Props
  anchor at the bottom-left of their blocking base; markers name cells
  (spawns, doors).
- **`mapToWorld(map, tileset)`** — bridges to a `@worldkit/world` `World`
  so `@worldkit/pathfinding` works unchanged.
- **`TilemapRenderer`** — draws to two canvases: `ground` (below
  characters) and `overhang` (tree canopies and roofs, above characters).
  Call `render(frame)` on a slow tick for the water/flower shimmer.

## Example

```ts
import {
  COZY_TILESET,
  TilemapRenderer,
  mapToWorld,
  parseMap,
} from '@worldkit/tilemap';

const map = parseMap(
  [
    'TTTTT',
    'T.*.T',
    'T.#~T',
    'TTTTT',
  ],
  {
    '.': { kind: 'tile', tile: 'grass' },
    '*': { kind: 'tile', tile: 'flowers' },
    '#': { kind: 'tile', tile: 'path' },
    '~': { kind: 'tile', tile: 'water' },
    T: { kind: 'prop', prop: 'tree' },
  },
  COZY_TILESET,
);

const world = mapToWorld(map, COZY_TILESET); // A*-ready
const renderer = new TilemapRenderer({ map, tileset: COZY_TILESET, ground, overhang });
renderer.render(0);
```

For the React layer (characters, dialogue, autonomous agents) see
`@worldkit/world-canvas`.
