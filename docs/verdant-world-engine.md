# Verdant World Engine

The agent world is rendered in the **verdant** art style: a painterly,
living place built from a data-driven **theme** system that authors tile and
prop art, and a **lighting engine** that grades that art across a full
day/night cycle — golden-hour cast shadows at dusk, warm lamp and window glow
at night, cool indigo ambience in between. It replaced an earlier flat,
Pokémon-GBA-style tileset, which has been removed — verdant is now the only
world style.

The first world built on it is **the Borough** — the agents' home map, where
they come back to relax and spend time with each other. Work hours will
eventually send them to a separate **office** map (a future world, not built
yet); the theme + lighting engine here is what makes adding that second world a
data exercise rather than an engine change.

Nothing here replaces the interactive canvas from
[interactive-world-canvas.md](./interactive-world-canvas.md); it layers on top
of the same headless-core → adapter → React stack.

## What the verdant style is

The look, distilled — the rules any new art should follow so the world reads
as one place:

- **Rich, hue-shifted ramps.** Every material is a 6–10 shade ramp, not a
  flat fill. Shadows shift toward purple/indigo (foliage, stone) or deep
  teal (water); highlights shift warm (yellow/orange). No shadow is "just a
  darker version" of the base.
- **Golden days, indigo nights.** Day palettes lean warm and sunlit; night
  palettes collapse toward `#2c3555` indigo and desaturate, so warm window
  and lamp light pops against the cool dark.
- **Texture over flatness.** Ground tiles carry mottling, blade clusters,
  pebbles, and fine noise, and use hash-picked `variants` so a field never
  reads as one repeated stamp.
- **Soft, warm-to-cool depth.** Props sit on baked purple contact shadows;
  buildings have deep, hue-shifted eaves shadows; canopies are irregular
  cloud silhouettes with a lit sun-side rim, not flat blobs.
- **A living day/night cycle.** A world clock drives a continuous grade:
  sun-angled cast shadows, an ambient multiply tint, and additive glow from
  lamps, lit windows, and fireflies. The scene is never a static picture.

Pixel density stays 1:1 — tile art is authored at native 32×32 to match the
character sprites, so the world is exactly as crisp as its residents.

## Themes are data packs

A theme is just a `Tileset` — `{ tiles, props }` of `TileDef`/`PropDef` — built
for one lighting mood. The verdant theme lives in
`packages/tilemap/src/themes/verdant/`:

| File         | Contents                                                                   |
| ------------ | -------------------------------------------------------------------------- |
| `palette.ts` | The master colour ramps, one entry per material and mood.                  |
| `ground.ts`  | Tiles: grass, meadow, tall-grass, flowers, fireflies, path, cobble, water. |
| `trees.ts`   | Props: oak, pine, bush.                                                    |
| `props.ts`   | Props: rock, stump, sign, mushrooms, lamp-post, well, market-stall.        |
| `houses.ts`  | Props: house-thatch / house-slate / house-plum.                            |
| `index.ts`   | `makeVerdantTileset(time)` — assembles and caches one per mood.            |

Both moods share tile/prop **ids**, so a single parsed map renders against
either — the only thing that changes is the baked palette.

### Authoring a new theme

1. **Master ramps.** For each material (grass, stone, timber, roof, ...) define
   a small ramp — deep / shade / mid / light / highlight — for both `day` and
   `night`. Nights are cool and indigo-shifted; days lean warm and golden. Keep
   ramps in one `palette.ts` so a mood re-tint is a single edit.

2. **Draw with `CharGrid`.** Author art with the `CharGrid` builder from
   `@worldkit/tilemap` (`fill`, `ellipse`, `px`, then `rows()`), **not**
   hand-typed strings (an architecture invariant). Each glyph is a palette key;
   `parsePixelArt(rows, palette)` rasterises it to RGBA. Tiles are 32×32; props
   are `tilesWide*32 × tilesHigh*32`. Register with `defineTile` / `defineProp`,
   which validate frame sizes and `baseRows`.

3. **Footprint = `baseRows` bottom rows.** A prop's bottom `baseRows` rows sit
   on the ground (block movement, draw below characters); the rows above draw on
   the overhang canvas and cover characters walking behind (tree canopies,
   roofs). `parseMap` validates that `x + tilesWide <= width` and
   `y - baseRows + 1 >= 0`, so a 2-wide oak can't sit in the last column and a
   3-wide house needs two clear rows.

4. **Variants** break up tiled fields. A `TileDef.variants` is a list of
   alternative frame-sets; the renderer hashes cell position to pick one, so a
   large lawn never repeats a single stamp. Ground tiles seed their scatter from
   a tiny deterministic PRNG so variants stay stable across builds.

5. **Light emitters** make a tile or prop glow at night. Add a `lights: []` of
   `LightEmitter` (`x`, `y` in art pixels; `radius`, `color`, `intensity`, and
   optional `flicker`). Bake a soft bloom into the night art too, and gate the
   emitter on `time === 'night'` — lamp heads, lit windows and fireflies do
   exactly this. The base renderer ignores `lights`; only the lighting
   compositor reads them.

## The lighting engine

Art is baked in two moods; the **grade** on top is continuous. It's driven by an
hour in `[0, 24)`.

### World clock

`useWorldClock({ hour?, speed?, running? })` (in `@worldkit/world-canvas`) is a
live clock as React state. It advances on a ~200ms real-time interval measuring
elapsed wall-clock time (so it stays accurate across dropped frames) and derives
everything downstream from the current hour:

- `phase` — `dawn` / `day` / `dusk` / `night` (`phaseAt`), for page-level
  backdrops and UI.
- `artMood` — `day` / `night` (`artMoodAt`), which baked palette to render.
- `ambient`, `shadow`, `lightLevel` — the grade, below.

`speed` is game-hours per real second (default `1/60` — an hour a minute;
`?speed=0.2` runs a full day in two minutes for demos). `setHour` scrubs.

### The grade

The `VillageCanvas`/`WorldCanvas` `hour` prop turns on three compositing
canvases over the flat scene:

- **Cast shadows** (`shadowAt`) — a sun-driven `ShadowProjection` (`skewX`,
  length, `alpha`) that leans and stretches props' and characters' shadows
  through the day, longest at the golden hours and gone at night (replaced by a
  faint static contact blob).
- **Ambient multiply** (`ambientAt`) — a full-frame tint multiplied over the
  scene: warm and near-clear at noon, amber at dusk, deep indigo at night.
- **Additive glow / point lights** (`lightLevel` + each emitter's `lights`) —
  lamp heads, lit windows and fireflies bloom additively on a screen-blended
  layer, scaled by how dark the scene is. `flicker` wobbles a lantern's output
  frame to frame via `flickerScale`.

### Layer stack

Within the scaled stage the canvases and DOM sprites stack by `z-index`:

```
z 0    ground        tile field (grass, path, water, ...)
z 5    shadows        sun-driven cast shadows (lighting only)
z 10+  actors         character sprites, zIndex = 10 + cellY (DOM)
z 500  overhang       tree canopies & roofs — draw ABOVE characters
z 600  ambient        day/night tint, mix-blend: multiply (lighting only)
z 610  glow           lamp/window/firefly light, mix-blend: screen (lighting only)
z 1000 bubbles        emote speech bubbles (DOM)
z 2000 dialogue       the FireRed-style dialogue box (DOM)
```

Characters use `zIndex: 10 + cellY` so a resident lower on the map draws in
front of one higher up, and both slip behind the overhang canopy/roof at z 500.

## Where it's wired

- **The Borough** — `packages/world-canvas/src/demo/the-borough.ts`
  (`makeBoroughScene(time)`): a 20×13 clearing — three cottages, a lamp-lit
  lane, a cobbled well plaza with a market stall, and a firefly pond.
- **Web** — `apps/web/src/components/world/world-page.tsx` runs the live cycle
  (`?hour=`, `?speed=`, `?time=day|night` back-compat) with a phase backdrop and
  an in-world clock chip.
- **Storybook** — `village-canvas.stories.tsx` has `VerdantNoon`,
  `VerdantGoldenHour`, `VerdantDusk`, `VerdantNight` at fixed hours.
