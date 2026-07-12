import { CharGrid, parsePixelArt } from '../../pixel-art.js'
import { TILE_SIZE, defineTile } from '../../tileset.js'
import type { PixelArt } from '../../pixel-art.js'
import type { TileDef } from '../../tileset.js'
import type { TimeOfDay } from '../../time.js'
import { COBBLE, DIRT, FLOWER, GRASS, WATER } from './palette.js'

const S = TILE_SIZE

/**
 * Tiny deterministic PRNG (mulberry32) so texture variants are stable across
 * builds. Ground fields want scattered, non-repeating noise; a seed per
 * variant gives each stamp its own mottling without any global state.
 */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Grass character palette. Every character is opaque so ground never shows a
 * hole. `a` base, `b` mid, `c` light, `d` shade, `e` deep, `f` warm highlight,
 * `g` teal-purple ground shadow.
 */
function grassPalette(time: TimeOfDay) {
  const p = GRASS[time]
  return {
    a: p.base,
    b: p.mid,
    c: p.lt,
    d: p.sh,
    e: p.deep,
    f: p.hi,
    g: p.shadow,
  }
}

/** A three-blade tuft with a lit tip. */
function tuft(
  g: CharGrid,
  x: number,
  y: number,
  tip: string,
  body: string,
): void {
  g.px(x, y, body)
  g.px(x, y - 1, body)
  g.px(x + 1, y - 1, tip)
  g.px(x + 2, y, body)
  g.px(x + 2, y - 1, body)
}

/**
 * A painterly grass frame: soft mottled patches, blade clusters, a couple of
 * embedded pebbles and fine color noise. `seed` shifts every scattered element
 * so the two variants never line up into a visible tiling grid.
 */
function grassFrame(time: TimeOfDay, seed: number): PixelArt {
  const g = new CharGrid(S, S, 'a')
  const r = rng(seed)
  const pick = (n: number) => Math.floor(r() * n)

  // Broad soft mottling: overlapping darker and lighter patches read as
  // uneven turf under a low sun rather than a flat wash.
  for (let i = 0; i < 5; i++) {
    g.ellipse(pick(S), pick(S), 4 + pick(4), 3 + pick(3), 'd')
  }
  for (let i = 0; i < 4; i++) {
    g.ellipse(pick(S), pick(S), 3 + pick(3), 2 + pick(2), 'b')
  }
  for (let i = 0; i < 3; i++) {
    g.ellipse(pick(S), pick(S), 2 + pick(2), 2 + pick(2), 'c')
  }

  // Blade clusters catching the light.
  for (let i = 0; i < 7; i++) {
    tuft(g, 2 + pick(S - 4), 3 + pick(S - 4), 'f', 'd')
  }
  for (let i = 0; i < 5; i++) {
    tuft(g, 2 + pick(S - 4), 3 + pick(S - 4), 'c', 'e')
  }

  // A couple of embedded pebbles — deep shade with a teal-purple base shadow.
  for (let i = 0; i < 2; i++) {
    const px = 3 + pick(S - 6)
    const py = 3 + pick(S - 6)
    g.ellipse(px, py + 1, 2, 1, 'g')
    g.ellipse(px, py, 2, 1.5, 'e')
    g.px(px - 1, py - 1, 'c')
  }

  // Fine color noise so no two 32x32 stretches feel identical.
  for (let i = 0; i < 24; i++) {
    const c = r() < 0.5 ? 'b' : r() < 0.5 ? 'c' : 'e'
    g.px(pick(S), pick(S), c)
  }

  return parsePixelArt(g.rows(), grassPalette(time))
}

function makeGrass(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'grass',
    walkable: true,
    frames: [grassFrame(time, 0x1111)],
    // Two extra variant frame-sets the renderer hashes across the field.
    variants: [[grassFrame(time, 0x2222)], [grassFrame(time, 0x3333)]],
  })
}

/** Meadow: grass lifted a half-step, dusted with flower flecks. */
function meadowFrame(time: TimeOfDay, seed: number): PixelArt {
  const g = new CharGrid(S, S, 'c') // lighter base than plain grass
  const r = rng(seed)
  const pick = (n: number) => Math.floor(r() * n)

  for (let i = 0; i < 4; i++) {
    g.ellipse(pick(S), pick(S), 4 + pick(3), 3 + pick(2), 'a')
  }
  for (let i = 0; i < 3; i++) {
    g.ellipse(pick(S), pick(S), 3 + pick(2), 2 + pick(2), 'd')
  }
  for (let i = 0; i < 6; i++) {
    tuft(g, 2 + pick(S - 4), 3 + pick(S - 4), 'f', 'b')
  }
  // Flower flecks: a petal dot with a warm center.
  const fl = FLOWER[time]
  for (let i = 0; i < 5; i++) {
    const fx = 3 + pick(S - 5)
    const fy = 3 + pick(S - 5)
    const petal = r() < 0.5 ? 'r' : 'w'
    g.px(fx, fy, petal)
    g.px(fx + 1, fy, petal)
    g.px(fx, fy + 1, 'y')
  }
  for (let i = 0; i < 16; i++) {
    g.px(pick(S), pick(S), r() < 0.5 ? 'b' : 'e')
  }

  const p = GRASS[time]
  return parsePixelArt(g.rows(), {
    a: p.base,
    b: p.mid,
    c: p.lt,
    d: p.sh,
    e: p.deep,
    f: p.hi,
    r: fl.petal,
    w: fl.cream,
    y: fl.center,
  })
}

function makeMeadow(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'meadow',
    terrain: 'grass',
    walkable: true,
    frames: [meadowFrame(time, 0x4444)],
    variants: [[meadowFrame(time, 0x5555)]],
  })
}

/** A tall blade clump; `lean` sways the lit tips with the breeze. */
function tallClump(g: CharGrid, x: number, y: number, lean: number): void {
  g.fill(x, y - 3, 1, 4, 'e')
  g.fill(x + 3, y - 5, 1, 6, 'e')
  g.fill(x + 6, y - 4, 1, 5, 'e')
  g.fill(x + 1, y - 4, 1, 3, 'd')
  g.fill(x + 4, y - 6, 1, 4, 'd')
  g.px(x + lean, y - 4, 'f')
  g.px(x + 3 + lean, y - 6, 'f')
  g.px(x + 6 + lean, y - 5, 'f')
  g.fill(x, y + 1, 7, 1, 'g') // teal-purple base shadow
}

function tallGrassFrame(time: TimeOfDay, lean: number): PixelArt {
  const g = new CharGrid(S, S, 'a')
  // A little base mottle so the ground between clumps isn't flat.
  for (const [x, y] of [
    [6, 6],
    [22, 4],
    [12, 18],
    [26, 24],
  ] as const) {
    g.ellipse(x, y, 3, 2, 'd')
  }
  tallClump(g, 3, 10, lean)
  tallClump(g, 15, 8, -lean)
  tallClump(g, 23, 13, lean)
  tallClump(g, 6, 22, -lean)
  tallClump(g, 17, 26, lean)
  tallClump(g, 25, 23, -lean)
  return parsePixelArt(g.rows(), grassPalette(time))
}

function makeTallGrass(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'tall-grass',
    terrain: 'grass',
    walkable: true,
    frames: [tallGrassFrame(time, 0), tallGrassFrame(time, 1)],
  })
}

/** A bloom on a short stem; `spin` twirls the petals between frames. */
function bloom(
  g: CharGrid,
  x: number,
  y: number,
  petal: string,
  center: string,
  spin: boolean,
): void {
  g.fill(x + 2, y + 2, 2, 2, center)
  if (spin) {
    g.fill(x + 2, y - 1, 2, 2, petal)
    g.fill(x + 2, y + 5, 2, 2, petal)
    g.fill(x - 1, y + 2, 2, 2, petal)
    g.fill(x + 5, y + 2, 2, 2, petal)
  } else {
    g.fill(x, y, 2, 2, petal)
    g.fill(x + 4, y, 2, 2, petal)
    g.fill(x, y + 4, 2, 2, petal)
    g.fill(x + 4, y + 4, 2, 2, petal)
  }
  g.fill(x + 2, y + 6, 1, 2, 's') // stem
}

function flowersFrame(time: TimeOfDay, spin: boolean): PixelArt {
  const g = new CharGrid(S, S, 'a')
  for (const [x, y] of [
    [5, 6],
    [24, 8],
    [10, 20],
    [26, 26],
  ] as const) {
    g.ellipse(x, y, 3, 2, 'd')
  }
  bloom(g, 6, 5, 'r', 'y', spin)
  bloom(g, 20, 18, 'w', 'o', !spin)
  bloom(g, 24, 4, 'r', 'y', !spin)
  tuft(g, 14, 12, 'f', 'd')
  tuft(g, 4, 26, 'f', 'd')
  const p = GRASS[time]
  const fl = FLOWER[time]
  return parsePixelArt(g.rows(), {
    a: p.base,
    b: p.mid,
    c: p.lt,
    d: p.sh,
    e: p.deep,
    f: p.hi,
    r: fl.petal,
    w: fl.cream,
    y: fl.center,
    o: fl.center,
    s: fl.stem,
  })
}

function makeFlowers(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'flowers',
    terrain: 'grass',
    walkable: true,
    frames: [flowersFrame(time, false), flowersFrame(time, true)],
  })
}

/**
 * Fireflies: glowing motes drifting over dark grass at night, butterflies by
 * day. Mote colors are pre-blended opaque so the ground stays hole-free; the
 * soft bloom is contributed by the `lights` array instead.
 */
function firefliesFrame(time: TimeOfDay, shift: boolean): PixelArt {
  const g = new CharGrid(S, S, 'a')
  for (const [x, y] of [
    [8, 6],
    [24, 10],
    [14, 22],
    [27, 26],
  ] as const) {
    g.ellipse(x, y, 3, 2, 'd')
  }
  for (let i = 0; i < 6; i++) {
    tuft(g, 4 + i * 4, 24 + ((i * 3) % 6), 'c', 'e')
  }

  if (time === 'night') {
    const motes: ReadonlyArray<readonly [number, number]> = shift
      ? [
          [8, 7],
          [24, 21],
          [17, 13],
        ]
      : [
          [10, 9],
          [22, 19],
          [15, 15],
        ]
    for (const [x, y] of motes) {
      g.px(x, y - 1, 'j') // faint halo ring, opaque
      g.px(x, y + 1, 'j')
      g.px(x - 1, y, 'j')
      g.px(x + 1, y, 'j')
      g.px(x, y, 'h') // bright core
    }
  } else {
    const flutter: ReadonlyArray<readonly [number, number, boolean]> = [
      [9, 8, shift],
      [23, 20, !shift],
    ]
    for (const [x, y, open] of flutter) {
      g.px(x, y, 'i')
      g.px(x, y + 1, 'i')
      if (open) {
        g.px(x - 1, y, 'h')
        g.px(x + 1, y, 'h')
      } else {
        g.px(x - 1, y - 1, 'h')
        g.px(x + 1, y - 1, 'h')
      }
    }
  }

  const p = GRASS[time]
  const palette: Record<string, string> =
    time === 'night'
      ? {
          a: p.base,
          b: p.mid,
          c: p.lt,
          d: p.sh,
          e: p.deep,
          f: p.hi,
          h: '#f2e6a0', // opaque mote core over dark grass
          j: '#8f9a5a', // opaque halo blended into grass
        }
      : {
          a: p.base,
          b: p.mid,
          c: p.lt,
          d: p.sh,
          e: p.deep,
          f: p.hi,
          h: '#f2ecc9', // butterfly wing
          i: '#8a7358', // butterfly body
        }
  return parsePixelArt(g.rows(), palette)
}

function makeFireflies(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'fireflies',
    terrain: 'grass',
    walkable: true,
    frames: [firefliesFrame(time, false), firefliesFrame(time, true)],
    ...(time === 'night'
      ? {
          lights: [
            { x: 16, y: 12, radius: 20, color: '#d8f0a0', intensity: 0.25 },
          ],
        }
      : {}),
  })
}

/**
 * Path character palette. `s` warm dirt base, `m`/`l` barely-there value
 * mottling, `t` pebble shade, `u` lit speck. No diamond/checker motif — the
 * lane is one cohesive dirt; texture is only sparse pebbles, thin soil flecks
 * and ±5% value drift. Variants differ only in pebble arrangement.
 */
function pathFrame(time: TimeOfDay, seed: number): PixelArt {
  const g = new CharGrid(S, S, 's')
  const r = rng(seed)
  const pick = (n: number) => Math.floor(r() * n)

  // Barely-perceptible value mottling — soft, low-contrast patches so the
  // packed earth breathes without ever reading as two different materials.
  for (let i = 0; i < 3; i++) {
    g.ellipse(pick(S), pick(S), 5 + pick(4), 4 + pick(3), 'm')
  }
  for (let i = 0; i < 3; i++) {
    g.ellipse(pick(S), pick(S), 4 + pick(3), 3 + pick(2), 'l')
  }
  // Thin scatter of soil flecks (both a touch darker and lighter).
  for (let i = 0; i < 18; i++) {
    g.px(pick(S), pick(S), r() < 0.5 ? 'l' : 'm')
  }
  // Sparse embedded pebbles: a small shaded dash with a tiny lit kiss. Their
  // placement is the only real difference between variants.
  for (let i = 0; i < 5; i++) {
    const px = 3 + pick(S - 6)
    const py = 3 + pick(S - 5)
    g.px(px, py, 't')
    g.px(px + 1, py, 't')
    g.px(px, py - 1, 'u')
  }

  const p = DIRT[time]
  return parsePixelArt(g.rows(), {
    s: p.base,
    m: p.mid,
    l: p.lt,
    t: p.deep,
    u: p.hi,
  })
}

function makePath(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'path',
    walkable: true,
    rim: GRASS[time].deep, // soft grassy edge where dirt meets turf
    frames: [pathFrame(time, 0x6161)],
    variants: [[pathFrame(time, 0x7171)]],
  })
}

/**
 * Cobbled plaza: warm gray-tan stones laid in offset courses on a soft mortar
 * bed. Each rounded-rectangular stone carries a lit top crown and a low-
 * contrast edge (only a value or two darker — not a heavy outline). A few
 * lighter highlight stones break the field. Walkable.
 */
function cobbleFrame(time: TimeOfDay): PixelArt {
  const g = new CharGrid(S, S, 'k') // mortar bed

  /** A single laid stone: rounded rect, lit crown, soft bottom-right edge. */
  const stone = (sx: number, sy: number, body: string): void => {
    const w = 7
    const h = 6
    g.fill(sx, sy, w, h, body) // stone face
    g.fill(sx, sy + h - 1, w, 1, 'n') // bottom edge shade
    g.fill(sx + w - 1, sy, 1, h, 'n') // right edge shade
    g.fill(sx, sy, w - 1, 1, 'h') // lit top crown
    g.fill(sx + 1, sy + 1, w - 3, 1, 'l') // inner highlight
    // Round the four corners back into the mortar.
    g.px(sx, sy, 'k')
    g.px(sx + w - 1, sy, 'k')
    g.px(sx, sy + h - 1, 'k')
    g.px(sx + w - 1, sy + h - 1, 'k')
  }

  // Offset courses, brick-laid. Every fifth stone is a lighter highlight.
  let i = 0
  for (let row = 0; row < 5; row++) {
    const cy = row * 6 - 1
    const offset = row % 2 === 0 ? -2 : 2
    for (let col = -1; col < 5; col++) {
      const cx = col * 8 + offset
      const body = i % 5 === 2 ? 'g' : i % 3 === 0 ? 'm' : 'b'
      stone(cx, cy, body)
      i++
    }
  }
  const p = COBBLE[time]
  return parsePixelArt(g.rows(), {
    k: p.mortar,
    p: p.deep,
    n: p.sh, // edge shade — only 1-2 values under body
    b: p.base, // stone body
    m: p.mid, // secondary stone
    g: p.lt, // lighter highlight stone
    l: p.hi, // inner highlight
    h: p.hi, // lit crown
  })
}

function makeCobble(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'cobble',
    terrain: 'cobble',
    walkable: true,
    frames: [cobbleFrame(time)],
  })
}

type Dash = readonly [x: number, y: number, w: number]

function waterFrame(
  time: TimeOfDay,
  crest: readonly Dash[],
  mid: readonly Dash[],
  trough: readonly Dash[],
  sparkles: readonly (readonly [number, number])[],
): PixelArt {
  const g = new CharGrid(S, S, 'w') // teal body
  // No centered deep-water blob: an identical per-tile shape reads as a
  // polka-dot grid across a pond. Depth comes from the ripple dashes.
  for (const [x, y, w] of trough) g.fill(x, y, w, 1, 'v') // dark ripple shadow
  for (const [x, y, w] of mid) g.fill(x, y, w, 1, 'z') // deep ripple
  for (const [x, y, w] of crest) {
    g.fill(x, y, w, 1, 'x') // ripple highlight
    g.px(x + w, y + 1, 'x') // hooked wave tip
  }
  for (const [x, y] of sparkles) g.px(x, y, 'p') // cool sparkle
  const p = WATER[time]
  return parsePixelArt(g.rows(), {
    w: p.mid,
    v: p.dark,
    z: p.deep,
    x: p.lt,
    p: p.sparkle,
  })
}

function makeWater(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'water',
    walkable: false,
    terrain: 'water',
    rim: WATER[time].dark, // dark-teal shoreline, never a pale/white edge
    frames: [
      waterFrame(
        time,
        [
          [5, 6, 6],
          [20, 14, 5],
          [9, 25, 4],
        ],
        [
          [16, 4, 5],
          [3, 16, 4],
          [24, 22, 5],
          [14, 29, 4],
        ],
        [
          [12, 9, 4],
          [24, 17, 4],
          [7, 20, 3],
          [19, 26, 4],
        ],
        [
          [8, 5],
          [23, 13],
          [12, 24],
        ],
      ),
      waterFrame(
        time,
        [
          [7, 7, 6],
          [22, 15, 5],
          [11, 26, 4],
        ],
        [
          [18, 5, 5],
          [5, 17, 4],
          [26, 23, 4],
          [16, 30, 4],
        ],
        [
          [14, 10, 4],
          [26, 18, 3],
          [9, 21, 3],
          [21, 27, 4],
        ],
        [
          [10, 6],
          [25, 14],
          [14, 25],
        ],
      ),
    ],
    // A hash-picked variant with shifted ripples so neighboring pond tiles
    // don't undulate in lockstep.
    variants: [
      [
        waterFrame(
          time,
          [
            [14, 3, 5],
            [3, 12, 6],
            [21, 21, 5],
          ],
          [
            [7, 7, 4],
            [22, 10, 5],
            [12, 18, 4],
            [4, 27, 5],
          ],
          [
            [18, 7, 3],
            [9, 14, 4],
            [25, 25, 4],
            [15, 30, 3],
          ],
          [
            [27, 5],
            [6, 18],
            [19, 23],
          ],
        ),
        waterFrame(
          time,
          [
            [16, 4, 5],
            [5, 13, 6],
            [23, 22, 5],
          ],
          [
            [9, 8, 4],
            [24, 11, 4],
            [14, 19, 4],
            [6, 28, 5],
          ],
          [
            [20, 8, 3],
            [11, 15, 4],
            [27, 26, 3],
            [17, 31, 3],
          ],
          [
            [4, 9],
            [29, 16],
            [21, 24],
          ],
        ),
      ],
    ],
  })
}

/** All verdant ground tiles for one lighting mood, keyed by tile id. */
export function verdantGround(time: TimeOfDay): Record<string, TileDef> {
  const tiles = [
    makeGrass(time),
    makeMeadow(time),
    makeTallGrass(time),
    makeFlowers(time),
    makeFireflies(time),
    makePath(time),
    makeCobble(time),
    makeWater(time),
  ]
  return Object.fromEntries(tiles.map((tile) => [tile.id, tile]))
}
