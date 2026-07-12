import { CharGrid, parsePixelArt } from '../../pixel-art.js'
import { defineProp } from '../../tileset.js'
import type { PropDef } from '../../tileset.js'
import type { TimeOfDay } from '../../time.js'
import {
  CONTACT,
  GLASS,
  GRASS,
  IRON,
  MARKET,
  MUSHROOM,
  ROOF_THATCH,
  STONE,
  WATER,
  WOOD,
} from './palette.js'

/** Mossy boulder, 1x1. Indigo-shifted shade, warm crown, teal moss patch. */
function makeRock(time: TimeOfDay): PropDef {
  const s = STONE[time]
  const palette = {
    v: CONTACT[time],
    m: s.mid,
    n: s.deep,
    o: s.hi,
    d: s.sh,
    g: GRASS[time].sh, // moss
    b: GRASS[time].lt,
  }
  return defineProp({
    id: 'rock',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 32)
        g.ellipse(16, 27, 12, 3, 'v')
        g.ellipse(16, 17, 12, 9, 'n')
        g.ellipse(16, 16.5, 10.5, 7.5, 'm')
        g.ellipse(20, 19, 6, 4, 'd')
        g.ellipse(11, 12, 4.5, 3, 'o')
        g.px(19, 12, 'o')
        g.px(20, 12, 'o')
        g.px(17, 15, 'n')
        g.px(18, 16, 'n')
        g.px(18, 17, 'n')
        g.px(19, 18, 'n')
        g.ellipse(22, 21, 3, 2, 'g')
        g.px(9, 20, 'g')
        g.px(23, 22, 'b')
        return parsePixelArt(g.rows(), palette)
      })(),
    ],
  })
}

/** Cut stump with growth rings, 1x1. */
function makeStump(time: TimeOfDay): PropDef {
  const w = WOOD[time]
  const palette = {
    v: CONTACT[time],
    t: w.hi, // cut face
    r: w.mid, // rings
    q: w.lt, // bark
    n: w.sh, // bark shadow
    g: GRASS[time].sh, // moss
  }
  return defineProp({
    id: 'stump',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 32)
        g.ellipse(16, 27, 11, 3, 'v')
        g.fill(8, 16, 16, 10, 'q')
        g.fill(6, 24, 20, 2, 'q')
        g.fill(8, 16, 3, 10, 'n')
        g.fill(21, 16, 3, 10, 'n')
        g.ellipse(16, 14, 10, 5, 'n')
        g.ellipse(16, 13.5, 8.5, 4, 't')
        g.ellipse(16, 13.5, 5, 2.2, 'r')
        g.ellipse(16, 13.5, 2, 0.8, 't')
        g.px(16, 13, 'r')
        g.ellipse(10, 18, 2.5, 1.5, 'g')
        g.px(22, 20, 'g')
        return parsePixelArt(g.rows(), palette)
      })(),
    ],
  })
}

/** Wooden signpost, 1x1. */
function makeSign(time: TimeOfDay): PropDef {
  const w = WOOD[time]
  const palette = {
    v: CONTACT[time],
    k: IRON[time].base, // bracket / frame
    u: w.hi, // board
    b: w.mid, // grain
    q: w.sh, // lettering / post
  }
  return defineProp({
    id: 'sign',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 32)
        g.ellipse(16, 28, 9, 2, 'v')
        g.fill(14, 18, 4, 10, 'k')
        g.fill(15, 18, 2, 9, 'q')
        g.fill(3, 4, 26, 14, 'k')
        g.fill(5, 6, 22, 10, 'u')
        g.fill(5, 10, 22, 1, 'b')
        g.fill(7, 8, 6, 1, 'q')
        g.fill(15, 8, 8, 1, 'q')
        g.fill(7, 12, 10, 1, 'q')
        g.fill(19, 12, 5, 1, 'q')
        return parsePixelArt(g.rows(), palette)
      })(),
    ],
  })
}

/** A toadstool cluster, 1x1. Decorative and walkable. */
function makeMushrooms(time: TimeOfDay): PropDef {
  const m = MUSHROOM[time]
  const palette = {
    v: CONTACT[time],
    c: m.cap,
    h: m.hi,
    s: m.stalk,
    d: m.shade,
    w: m.spot,
  }
  return defineProp({
    id: 'mushrooms',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    walkable: true,
    frames: [
      (() => {
        const g = new CharGrid(32, 32)
        g.ellipse(15, 28, 9, 2, 'v')
        g.fill(11, 18, 3, 8, 's')
        g.fill(13, 18, 1, 8, 'd')
        g.ellipse(12, 15, 6, 4, 'c')
        g.ellipse(10, 13.5, 3, 1.8, 'h')
        g.px(9, 15, 'w')
        g.px(14, 13, 'w')
        g.fill(21, 22, 3, 5, 's')
        g.fill(23, 22, 1, 5, 'd')
        g.ellipse(22, 20, 4.5, 3, 'c')
        g.ellipse(21, 18.5, 2.2, 1.2, 'h')
        g.px(24, 19, 'w')
        return parsePixelArt(g.rows(), palette)
      })(),
    ],
  })
}

/**
 * Lamp-post — 1 tile wide x 2 high (32x64), post on the ground. Wrought-iron
 * post with a glass head. At night the head glows warm (baked bloom in the
 * art) and casts a flickering light; by day it's unlit with no light emitter.
 */
function lampFrame(
  time: TimeOfDay,
  flare: boolean,
): ReturnType<typeof parsePixelArt> {
  const g = new CharGrid(32, 64)
  const isNight = time === 'night'
  const palette = {
    v: CONTACT[time],
    k: IRON[time].sh, // ironwork
    q: IRON[time].base, // post
    p: IRON[time].lt, // post light edge
    y: isNight ? GLASS.night.pane : '#cfc9b4', // glass
    z: isNight ? GLASS.night.bright : '#8a8474', // flame / unlit wick
    o: isNight ? GLASS.night.bloomOuter : '#00000000',
    w: isNight ? GLASS.night.bloomInner : '#00000000',
  }
  g.ellipse(16, 59, 8, 2, 'v')
  if (isNight) {
    g.ellipse(16, 18, flare ? 13 : 11, flare ? 13 : 11, 'o')
    g.ellipse(16, 18, flare ? 8 : 6.5, flare ? 8 : 6.5, 'w')
  }
  // Post with a lit edge and a scrolled crossbar under the head.
  g.fill(14, 24, 4, 34, 'q')
  g.fill(14, 24, 1, 34, 'p')
  g.fill(10, 24, 12, 2, 'k')
  g.px(9, 25, 'k')
  g.px(22, 25, 'k')
  // Head: iron cap, glass box, flame.
  g.fill(11, 8, 10, 2, 'k')
  g.fill(14, 6, 4, 2, 'k')
  g.fill(11, 10, 2, 12, 'k')
  g.fill(19, 10, 2, 12, 'k')
  g.fill(11, 22, 10, 2, 'k')
  g.fill(13, 10, 6, 12, 'y')
  g.fill(15, flare ? 12 : 13, 2, flare ? 6 : 5, 'z')
  return parsePixelArt(g.rows(), palette)
}

function makeLampPost(time: TimeOfDay): PropDef {
  const isNight = time === 'night'
  return defineProp({
    id: 'lamp-post',
    tilesWide: 1,
    tilesHigh: 2,
    baseRows: 1,
    frames: isNight
      ? [lampFrame(time, false), lampFrame(time, true)]
      : [lampFrame(time, false)],
    ...(isNight
      ? {
          lights: [
            {
              x: 16,
              y: 10,
              radius: 80,
              color: '#ffb45e',
              intensity: 0.9,
              flicker: 0.3,
            },
          ],
        }
      : {}),
  })
}

/**
 * Well — 2 tiles wide x 3 high (64x96), the bottom 2 rows on the ground. A
 * stone ring under a little shingled roof on two posts, with a rope and
 * bucket. The roof row overhangs.
 */
function makeWell(time: TimeOfDay): PropDef {
  const st = STONE[time]
  const w = WOOD[time]
  const roof = ROOF_THATCH[time]
  const palette = {
    v: CONTACT[time],
    m: st.mid,
    n: st.deep,
    o: st.hi,
    d: st.sh,
    q: w.mid, // post / frame
    p: w.hi,
    x: w.sh,
    R: roof.mid,
    L: roof.light,
    D: roof.shadow,
    r: '#8a7358', // rope
    b: '#5a4632', // bucket
    k: WATER[time].dark, // dark water in the shaft
  }
  return defineProp({
    id: 'well',
    tilesWide: 2,
    tilesHigh: 3,
    baseRows: 2,
    frames: [
      (() => {
        const g = new CharGrid(64, 96)
        // Contact shadow.
        g.ellipse(32, 90, 26, 4, 'v')
        // Shingled gable roof (overhang row).
        for (let y = 4; y < 26; y++) {
          const half = Math.round(6 + ((y - 4) * 22) / 22)
          g.fill(32 - half, y, half * 2, 1, 'R')
          g.fill(32 - half, y, 2, 1, 'D')
          g.fill(32 + half - 2, y, 2, 1, 'D')
        }
        g.fill(24, 3, 16, 2, 'D') // ridge cap
        g.fill(25, 5, 14, 1, 'L') // ridge gloss
        g.fill(2, 24, 60, 3, 'D') // eave shade band
        // Support posts.
        g.fill(10, 26, 4, 30, 'q')
        g.fill(50, 26, 4, 30, 'q')
        g.fill(10, 26, 1, 30, 'p')
        g.fill(50, 26, 1, 30, 'p')
        // Rope and bucket hanging in the opening.
        g.fill(31, 27, 2, 20, 'r')
        g.fill(28, 47, 8, 8, 'b')
        g.fill(28, 47, 8, 1, 'x')
        // Stone ring wall.
        g.fill(6, 58, 52, 30, 'n')
        g.fill(8, 60, 48, 26, 'm')
        g.fill(8, 60, 48, 3, 'o') // lit top course
        // Dark water in the shaft.
        g.ellipse(32, 66, 20, 5, 'k')
        // Stone joints.
        for (const y of [66, 72, 78, 84] as const) {
          g.fill(8, y, 48, 1, 'd')
        }
        for (const [x, y] of [
          [16, 69],
          [32, 75],
          [46, 69],
          [24, 81],
          [40, 81],
        ] as const) {
          g.fill(x, y, 4, 1, 'o')
        }
        return parsePixelArt(g.rows(), palette)
      })(),
    ],
  })
}

/**
 * Market stall — 3 tiles wide x 3 high (96x96), the bottom 2 rows on the
 * ground. A striped awning (overhang) over a wooden counter stacked with
 * crates and produce.
 */
function makeMarketStall(time: TimeOfDay): PropDef {
  const w = WOOD[time]
  const m = MARKET[time]
  const palette = {
    v: CONTACT[time],
    A: m.stripeA, // awning stripe
    B: m.stripeB, // awning stripe
    d: '#00000030', // awning underside shade
    q: w.mid, // frame / counter
    p: w.hi,
    x: w.sh,
    c: m.crate,
    C: m.crateLt,
    r: '#c96a4a', // apples
    o: '#d99a4a', // squash
    l: '#7fa04c', // greens
  }
  return defineProp({
    id: 'market-stall',
    tilesWide: 3,
    tilesHigh: 3,
    baseRows: 2,
    frames: [
      (() => {
        const g = new CharGrid(96, 96)
        g.ellipse(48, 90, 42, 4, 'v')
        // Frame posts.
        g.fill(8, 20, 5, 68, 'q')
        g.fill(83, 20, 5, 68, 'q')
        g.fill(8, 20, 1, 68, 'p')
        g.fill(83, 20, 1, 68, 'p')
        // Striped awning (overhang row), scalloped front edge.
        for (let s = 0; s < 8; s++) {
          const x = 6 + s * 11
          g.fill(x, 8, 11, 20, s % 2 === 0 ? 'A' : 'B')
        }
        g.fill(4, 6, 88, 3, 'x') // awning ridge board
        g.fill(6, 26, 84, 2, 'd') // underside shade
        // Scalloped hem.
        for (let s = 0; s < 8; s++) {
          const x = 6 + s * 11
          g.ellipse(x + 5, 28, 5, 3, s % 2 === 0 ? 'A' : 'B')
        }
        // Counter.
        g.fill(6, 60, 84, 12, 'q')
        g.fill(6, 60, 84, 2, 'p')
        g.fill(6, 70, 84, 2, 'x')
        // Crates on the counter.
        for (const cx of [14, 44, 68] as const) {
          g.fill(cx, 46, 18, 16, 'c')
          g.fill(cx, 46, 18, 2, 'C')
          g.fill(cx, 46, 2, 16, 'C')
          g.fill(cx + 8, 46, 1, 16, 'x')
        }
        // Produce spilling over the crate rims.
        for (const [x, y, ch] of [
          [17, 44, 'r'],
          [21, 43, 'r'],
          [25, 45, 'o'],
          [47, 44, 'l'],
          [51, 43, 'l'],
          [55, 45, 'r'],
          [71, 44, 'o'],
          [75, 43, 'r'],
          [79, 45, 'l'],
        ] as const) {
          g.ellipse(x, y, 2, 2, ch)
        }
        return parsePixelArt(g.rows(), palette)
      })(),
    ],
  })
}

/** All verdant props for one lighting mood, keyed by prop id. */
export function verdantProps(time: TimeOfDay): Record<string, PropDef> {
  const props = [
    makeRock(time),
    makeStump(time),
    makeSign(time),
    makeMushrooms(time),
    makeLampPost(time),
    makeWell(time),
    makeMarketStall(time),
  ]
  return Object.fromEntries(props.map((p) => [p.id, p]))
}
