# @worldkit/lighting

Headless day/night physics for the world engine: a continuous world clock,
sun model, ambient color grading, and shadow projection. Plain serializable
objects, pure functions, zero dependencies — rendering adapters (the
lighting compositor in `@worldkit/tilemap`) consume these values.

## World clock

```ts
import { createClock, tickClock } from '@worldkit/lighting'

let clock = createClock({ hour: 17, speed: 1 / 60 }) // 1 game hour / real minute
clock = tickClock(clock, elapsedSeconds) // immutable, wraps mod 24
```

## Phases and art mood

- `phaseAt(hour)` → `'dawn' | 'day' | 'dusk' | 'night'` with boundaries
  `DAWN_START` (5), `DAY_START` (7), `DUSK_START` (17.5), `NIGHT_START` (19.5).
- `artMoodAt(hour)` → `'day' | 'night'` — which baked tile palette to show
  (day art from 6.5 to 18.5).

## Ambient grade

`ambientAt(hour)` interpolates `AMBIENT_KEYFRAMES` piecewise-linearly (RGB),
continuous across midnight:

```ts
type AmbientGrade = {
  tint: string // multiply-blend layer color
  glow: string // screen-blend halo tone
  darkness: number // 0..1 night strength
}
```

`lightLevelAt(hour)` is `1 - darkness` — compositors fade point lights in as
it drops.

## Sun and shadows

- `sunAt(hour)` → `{ visible, elevation 0..1, azimuth -1(east)..+1(west) }`,
  a sine arc from `DAWN_START` to `NIGHT_START` peaking at `SOLAR_NOON`.
- `shadowAt(hour)` → `{ skewX, scaleY, alpha } | null` — how prop silhouettes
  fall on the ground: long west-leaning at dawn, short at noon, long
  east-leaning at dusk, `null` at night. `skewX` is a CSS-style horizontal
  skew factor; `scaleY` is shadow length as a fraction of prop height.

## Point lights

`PointLight` is the placed-light shape (structurally compatible with
`PlacedLight` from `@worldkit/tilemap`). `flickerScale(light, frame)` gives a
deterministic brightness multiplier around 1.0 (±`flicker * 0.25`) for flame
waver — reproducible, no randomness.
