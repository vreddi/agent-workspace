import { CharGrid, parsePixelArt } from '../../pixel-art.js'
import { defineProp } from '../../tileset.js'
import type { PropDef } from '../../tileset.js'
import type { TimeOfDay } from '../../time.js'
import { BUSH, CONTACT, OAK, PINE, WOOD } from './palette.js'

/**
 * Oak — 2 tiles wide x 3 high (64x96), the bottom row on the ground. A big
 * painterly canopy with an irregular cloud-like silhouette: a deep indigo
 * shadow core pooling at the lower-left, mid-green body, a sunlit warm-green
 * rim on the upper-right (sun) side, and scattered leaf specks. The dark
 * outline is reserved for the lower/shadow side only. Visible trunk with a
 * root flare and a soft purple contact shadow.
 */
function makeOak(time: TimeOfDay): PropDef {
  const o = OAK[time]
  const palette = {
    v: CONTACT[time],
    k: o.deepcore, // silhouette / shadow core
    c: o.core,
    f: o.sh,
    g: o.mid,
    h: o.lt,
    i: o.hi,
    j: o.rim, // warm sun rim
    q: WOOD[time].mid,
    p: WOOD[time].hi,
    n: WOOD[time].sh,
  }
  return defineProp({
    id: 'oak',
    tilesWide: 2,
    tilesHigh: 3,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(64, 96)
        // Soft purple contact shadow pooled under the trunk.
        g.ellipse(32, 90, 20, 4, 'v')
        // Trunk with a widening root flare.
        g.fill(26, 62, 12, 28, 'k')
        g.fill(22, 84, 20, 6, 'k')
        g.fill(28, 63, 8, 26, 'q')
        g.fill(24, 85, 16, 4, 'q')
        g.fill(33, 63, 3, 25, 'p') // lit right edge
        g.fill(28, 63, 2, 25, 'n') // shaded left edge
        g.px(30, 74, 'n') // bark knot
        g.px(31, 75, 'n')

        // Irregular cloud silhouette — overlapping lumps of different sizes so
        // the crown never reads as a single circle. `k` is the shadow/outline.
        g.ellipse(24, 38, 22, 20, 'k')
        g.ellipse(44, 34, 18, 17, 'k')
        g.ellipse(14, 32, 12, 12, 'k')
        g.ellipse(34, 17, 16, 14, 'k')
        g.ellipse(51, 46, 12, 11, 'k')
        g.ellipse(18, 49, 11, 10, 'k')
        g.ellipse(49, 20, 11, 10, 'k')
        // Bottom-center lump seats the crown onto the trunk — without it the
        // canopy floats and the oak reads as a bush above a post.
        g.ellipse(31, 53, 17, 12, 'k')

        // Deep indigo shadow core pooling at the lower-left.
        g.ellipse(20, 44, 18, 16, 'c')
        g.ellipse(13, 40, 9, 9, 'c')
        g.ellipse(30, 48, 12, 9, 'c')
        g.ellipse(30, 54, 12, 9, 'c')

        // Mid-dark body filling most of the mass.
        g.ellipse(28, 38, 20, 18, 'f')
        g.ellipse(45, 37, 15, 14, 'f')
        g.ellipse(16, 33, 9, 9, 'f')
        g.ellipse(38, 22, 13, 12, 'f')

        // Main mid green, drifting up and to the right (toward the sun).
        g.ellipse(33, 31, 18, 16, 'g')
        g.ellipse(47, 31, 13, 12, 'g')
        g.ellipse(26, 24, 12, 11, 'g')

        // Lit green stepping into the light on the upper-right.
        g.ellipse(41, 23, 13, 12, 'h')
        g.ellipse(31, 18, 10, 9, 'h')
        g.ellipse(51, 27, 8, 7, 'h')

        // Bright sunlit clusters, upper-right.
        g.ellipse(45, 16, 8, 7, 'i')
        g.ellipse(53, 23, 4, 4, 'i')
        g.ellipse(35, 12, 5, 4, 'i')

        // Warm-green rim skimming the upper-right crown.
        g.ellipse(51, 14, 3, 2.5, 'j')
        g.ellipse(45, 9, 2.5, 2, 'j')
        g.px(56, 18, 'j')
        g.px(53, 11, 'j')
        g.px(48, 7, 'j')
        g.px(58, 24, 'j')

        // Dark outline / notches kept to the lower and shadow-side edge only.
        for (const [x, y] of [
          [16, 52],
          [24, 54],
          [32, 54],
          [40, 52],
          [12, 44],
          [20, 40],
          [28, 46],
          [10, 36],
        ] as const) {
          g.px(x, y, 'k')
          g.px(x + 1, y, 'k')
        }
        // Leaf-cluster specks scattered across the lit crown.
        for (const [x, y] of [
          [38, 18],
          [30, 26],
          [46, 26],
          [50, 34],
          [40, 32],
          [34, 22],
        ] as const) {
          g.px(x, y, 'i')
        }
        return parsePixelArt(g.rows(), palette)
      })(),
    ],
  })
}

/**
 * Pine — 1 tile wide x 3 high (32x96), bottom row on the ground. Three stacked
 * needle tiers with a purple-tinged core and a warm-shaded trunk.
 */
function makePine(time: TimeOfDay): PropDef {
  const pn = PINE[time]
  const palette = {
    v: CONTACT[time],
    k: pn.core, // silhouette / core
    f: pn.dark,
    g: pn.mid,
    h: pn.lt,
    i: pn.hi,
    q: WOOD[time].mid,
    n: WOOD[time].sh,
  }
  return defineProp({
    id: 'pine',
    tilesWide: 1,
    tilesHigh: 3,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 96)
        g.ellipse(16, 90, 12, 3, 'v')
        // Trunk.
        g.fill(13, 74, 6, 16, 'k')
        g.fill(14, 75, 4, 14, 'q')
        g.fill(14, 75, 1, 14, 'n')
        const tiers: ReadonlyArray<
          readonly [top: number, bottom: number, half: number]
        > = [
          [4, 30, 9],
          [22, 54, 12],
          [44, 80, 15],
        ]
        for (const [top, bottom, half] of tiers) {
          for (let y = top; y <= bottom; y++) {
            const t = (y - top) / (bottom - top)
            const w = Math.max(1, Math.round(t * half))
            g.fill(16 - w, y, w * 2, 1, 'k')
            if (w > 1) g.fill(16 - w + 1, y, w * 2 - 2, 1, 'f')
          }
        }
        // Mid tone up the lit (left) flank of each tier.
        for (const [top, bottom, half] of tiers) {
          for (let y = top + 2; y <= bottom - 1; y++) {
            const t = (y - top) / (bottom - top)
            const w = Math.max(1, Math.round(t * half) - 2)
            if (w < 1) continue
            g.fill(16 - w, y, Math.max(1, Math.floor(w * 0.9)), 1, 'g')
          }
        }
        for (const [x, y] of [
          [14, 8],
          [11, 24],
          [17, 34],
          [9, 46],
          [19, 58],
          [8, 70],
          [14, 66],
        ] as const) {
          g.px(x, y, 'h')
        }
        for (const [x, y] of [
          [13, 12],
          [12, 40],
          [10, 62],
        ] as const) {
          g.px(x, y, 'i')
        }
        return parsePixelArt(g.rows(), palette)
      })(),
    ],
  })
}

/** Bush — a round shrub, 1x1. Rides the grass ramp with a rounder crown. */
function makeBush(time: TimeOfDay): PropDef {
  const b = BUSH[time]
  const palette = {
    v: CONTACT[time],
    k: b.core,
    f: b.dark,
    g: b.mid,
    h: b.lt,
    i: b.hi,
  }
  return defineProp({
    id: 'bush',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 32)
        g.ellipse(16, 28, 12, 3, 'v')
        g.ellipse(9, 20, 8, 7, 'k')
        g.ellipse(22, 21, 8, 6.5, 'k')
        g.ellipse(16, 14, 8, 7, 'k')
        g.ellipse(9, 20, 6.5, 5.5, 'f')
        g.ellipse(22, 21, 6.5, 5, 'f')
        g.ellipse(16, 14, 6.5, 5.5, 'f')
        g.ellipse(9, 18, 4.5, 3.5, 'g')
        g.ellipse(21, 19, 4.5, 3, 'g')
        g.ellipse(15, 12, 4.5, 3.5, 'g')
        g.ellipse(8, 16, 2.5, 1.5, 'h')
        g.ellipse(14, 10, 2.8, 1.8, 'h')
        g.ellipse(21, 17, 2, 1.2, 'h')
        for (const [x, y] of [
          [7, 14],
          [13, 8],
          [20, 15],
        ] as const) {
          g.px(x, y, 'i')
        }
        for (const [x, y] of [
          [12, 18],
          [18, 20],
          [10, 22],
          [16, 16],
        ] as const) {
          g.px(x, y, 'k')
        }
        return parsePixelArt(g.rows(), palette)
      })(),
    ],
  })
}

/** Oak, pine and bush for one lighting mood, keyed by prop id. */
export function verdantTrees(time: TimeOfDay): Record<string, PropDef> {
  const props = [makeOak(time), makePine(time), makeBush(time)]
  return Object.fromEntries(props.map((p) => [p.id, p]))
}
