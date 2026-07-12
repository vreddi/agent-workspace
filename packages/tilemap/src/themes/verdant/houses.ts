import { CharGrid, parsePixelArt } from '../../pixel-art.js'
import { defineProp } from '../../tileset.js'
import type { PropDef, LightEmitter } from '../../tileset.js'
import type { TimeOfDay } from '../../time.js'
import {
  CONTACT,
  GLASS,
  PLASTER,
  ROOF_PLUM,
  ROOF_SLATE,
  ROOF_THATCH,
  SMOKE,
  STONE,
  TIMBER,
  WOOD,
} from './palette.js'

/**
 * Cottages — 3 tiles wide x 4 high (96x128), the bottom 2 rows on the ground
 * and the top 2 rows (roof) overhanging characters that walk behind. Geometry
 * is built once and shared across the three roof variants; only the roof
 * palette changes. Two frames drift the chimney smoke. A deep purple-shifted
 * eaves shadow bands the wall under the overhang, and a soft purple contact
 * shadow grounds the whole thing.
 */

const W = 96
const H = 128

const RIDGE_Y = 8
const EAVE_Y = 56
const half = (y: number) =>
  Math.round(10 + ((y - RIDGE_Y) * 36) / (EAVE_Y - RIDGE_Y))

/** Window centers in art-pixel coordinates (used for both art and lights). */
const WINDOWS = [
  { x: 24, y: 83 },
  { x: 72, y: 83 },
] as const

function houseRows(smokePhase: 0 | 1, time: TimeOfDay): string[] {
  const g = new CharGrid(W, H)
  const isNight = time === 'night'

  // Soft purple contact shadow.
  g.ellipse(48, 122, 44, 5, 'v')

  // --- Roof (overhang rows) ---
  for (let y = RIDGE_Y; y < EAVE_Y; y++) {
    const w = half(y)
    g.fill(48 - w, y, w * 2, 1, 'R')
    g.fill(48 - w, y, 2, 1, 'D') // sloped edge trim
    g.fill(48 + w - 2, y, 2, 1, 'D')
  }
  g.fill(40, RIDGE_Y - 1, 16, 2, 'D') // ridge cap
  g.fill(41, RIDGE_Y + 1, 14, 2, 'G') // ridge highlight
  // Shingle / thatch courses: shadow seams stepping down the slope.
  for (const y of [16, 24, 32, 40, 48] as const) {
    const w = half(y) - 2
    g.fill(48 - w, y, w * 2, 1, 'D')
    g.fill(48 - w, y + 1, w * 2, 1, 'L') // gloss line under each seam
  }
  // Staggered course ticks for texture.
  for (const [x, y] of [
    [38, 20],
    [54, 20],
    [30, 28],
    [46, 28],
    [62, 28],
    [22, 36],
    [40, 36],
    [58, 36],
    [74, 36],
    [16, 44],
    [34, 44],
    [52, 44],
    [70, 44],
    [82, 44],
  ] as const) {
    g.fill(x, y, 1, 3, 'D')
  }

  // Stone chimney rising through the right slope, smoke drifting off it.
  g.fill(66, 2, 16, 4, 'f')
  g.fill(67, 2, 14, 2, 'o')
  g.fill(67, 6, 14, 22, 'F')
  g.fill(67, 6, 2, 22, 'f')
  for (const y of [11, 16, 21] as const) g.fill(69, y, 12, 1, 'f')
  for (const [x, y] of [
    [72, 8],
    [77, 13],
    [70, 18],
    [76, 23],
  ] as const) {
    g.fill(x, y, 3, 2, 'o')
  }
  if (smokePhase === 0) {
    g.ellipse(74, 0, 3, 1.5, 'M')
    g.ellipse(79, -2, 2.5, 1.2, 'm')
    g.ellipse(71, -4, 2, 1, 'm')
  } else {
    g.ellipse(76, 0, 3, 1.5, 'M')
    g.ellipse(71, -2, 2.5, 1.2, 'm')
    g.ellipse(81, -4, 2, 1, 'm')
  }

  // Deep purple-shifted eaves shadow band where the roof overhangs the wall.
  g.fill(2, EAVE_Y, 92, 6, 'e')

  // --- Wall (ground rows) ---
  g.fill(4, 62, 88, 48, 'W')
  // Night lamplight blooming through the plaster around each window.
  if (isNight) {
    for (const win of WINDOWS) {
      g.ellipse(win.x, win.y, 15, 12, '1')
      g.ellipse(win.x, win.y, 10, 8, '2')
    }
  }
  // Plaster shading: darker toward the base, lit near the eave.
  g.fill(4, 62, 88, 2, 'H') // lit top edge under eave
  g.fill(4, 104, 88, 6, 'Y') // grounded lower shade
  // Timber framing: corner posts, a mid rail and gable braces.
  g.fill(4, 62, 6, 48, 'T')
  g.fill(86, 62, 6, 48, 'T')
  g.fill(4, 62, 2, 48, 't') // lit edge
  g.fill(86, 62, 1, 48, 'u')
  g.fill(4, 84, 88, 4, 'T') // mid rail
  g.fill(4, 84, 88, 1, 't')
  g.fill(4, 106, 88, 3, 'u') // base rail

  // --- Windows: four-pane casements, amber-lit after dark ---
  for (const win of WINDOWS) {
    const wx = win.x - 8
    const wy = win.y - 9
    g.fill(wx, wy, 16, 18, 'T') // timber frame
    g.fill(wx + 2, wy + 2, 12, 14, 'B') // glass
    g.fill(wx + 2, wy + 2, 12, 4, 'E') // bright upper glass
    g.fill(wx + 7, wy + 2, 2, 14, 'T') // vertical mullion
    g.fill(wx + 2, wy + 8, 12, 2, 'T') // horizontal mullion
    g.fill(wx - 1, wy + 18, 18, 2, 'u') // sill
  }

  // --- Arched plank door ---
  g.fill(40, 84, 16, 26, 'K')
  g.fill(42, 82, 12, 2, 'K')
  g.fill(44, 80, 8, 2, 'K')
  g.fill(42, 86, 12, 24, 'Q')
  g.fill(44, 84, 8, 2, 'Q')
  for (const px of [45, 48, 51] as const) g.fill(px, 85, 1, 25, 'P')
  g.fill(52, 97, 2, 3, 'y') // handle

  // --- Fieldstone foundation course ---
  g.fill(2, 110, 92, 12, 'F')
  g.fill(2, 110, 92, 1, 'f')
  for (const [x, y, w] of [
    [8, 114, 7],
    [24, 116, 8],
    [42, 112, 7],
    [60, 116, 8],
    [78, 113, 7],
  ] as const) {
    g.fill(x, y, w, 1, 'f')
  }
  for (const [x, y] of [
    [16, 112],
    [50, 112],
    [72, 118],
    [34, 118],
  ] as const) {
    g.fill(x, y, 4, 1, 'o')
  }
  g.fill(38, 110, 20, 3, 'o') // worn step at the door

  return g.rows()
}

type RoofColors = { ridge: string; light: string; mid: string; shadow: string }

export type VerdantHouse = {
  id: string
  roofs: Record<TimeOfDay, RoofColors>
}

function bodyPalette(time: TimeOfDay): Record<string, string> {
  const isNight = time === 'night'
  const pl = PLASTER[time]
  const tb = TIMBER[time]
  const st = STONE[time]
  const wd = WOOD[time]
  const gl = GLASS[time]
  return {
    v: CONTACT[time],
    // eaves shadow — purple-shifted deep plaster
    e: isNight ? '#2c2a40' : '#7a6a80',
    // plaster
    W: pl.mid,
    H: pl.hi,
    Y: pl.sh,
    // timber framing
    T: tb.base,
    t: tb.lt,
    u: tb.sh,
    // stone
    F: st.mid,
    f: st.deep,
    o: st.hi,
    // door
    K: tb.sh,
    Q: wd.sh,
    P: wd.deep,
    y: gl.frame,
    // glass
    B: gl.pane,
    E: gl.bright,
    // window wall bloom (night only; harmless placeholders by day)
    '1': isNight ? GLASS.night.bloomOuter : pl.mid,
    '2': isNight ? GLASS.night.bloomInner : pl.mid,
    // smoke
    M: SMOKE[time].thick,
    m: SMOKE[time].thin,
  }
}

function makeHouse(house: VerdantHouse, time: TimeOfDay): PropDef {
  const roof = house.roofs[time]
  const palette = {
    ...bodyPalette(time),
    R: roof.mid,
    L: roof.light,
    G: roof.ridge,
    D: roof.shadow,
  }
  const frames = [houseRows(0, time), houseRows(1, time)].map((rows) =>
    parsePixelArt(rows, palette),
  )
  const lights: LightEmitter[] | undefined =
    time === 'night'
      ? WINDOWS.map((win) => ({
          x: win.x,
          y: win.y,
          radius: 56,
          color: '#ffc878',
          intensity: 0.7,
        }))
      : undefined
  return defineProp({
    id: house.id,
    tilesWide: 3,
    tilesHigh: 4,
    baseRows: 2,
    frames,
    ...(lights ? { lights } : {}),
  })
}

export const VERDANT_HOUSES: readonly VerdantHouse[] = [
  { id: 'house-thatch', roofs: ROOF_THATCH },
  { id: 'house-slate', roofs: ROOF_SLATE },
  { id: 'house-plum', roofs: ROOF_PLUM },
]

/** The three cottages for one lighting mood, keyed by prop id. */
export function verdantHouses(time: TimeOfDay): Record<string, PropDef> {
  return Object.fromEntries(
    VERDANT_HOUSES.map((house) => [house.id, makeHouse(house, time)]),
  )
}
