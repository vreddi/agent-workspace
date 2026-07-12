import { CharGrid, parsePixelArt } from '../pixel-art.js'
import { TILE_SIZE, defineTile } from '../tileset.js'
import type { TileDef } from '../tileset.js'
import type { TimeOfDay } from '../time.js'

/**
 * Ground palettes per lighting mood. Night is desaturated twilight moss
 * with cool, purple-leaning shadows — warm light is reserved for props
 * (windows, lanterns, fireflies). Day lifts the same hues into sun.
 */
const GRASS = {
  night: {
    a: '#4e5c41', // moss base
    b: '#415036', // dark blade
    c: '#5d6c4a', // light fleck
    d: '#37432e', // deep shade
  },
  day: {
    a: '#6d7f52',
    b: '#5e7045',
    c: '#7d905e',
    d: '#566744',
  },
} satisfies Record<TimeOfDay, Record<string, string>>

// Meadow sits a half-step darker than grass so broad fields read as a
// patchwork instead of a flat wash.
const MEADOW = {
  night: { ...GRASS.night, a: '#4b5940', b: '#3f4d35' },
  day: { ...GRASS.day, a: '#687a4e', b: '#596b42' },
} satisfies Record<TimeOfDay, Record<string, string>>

/** A tiny two-blade grass tuft, the classic GBA ground motif. */
function blade(g: CharGrid, x: number, y: number, char: string): void {
  g.px(x, y, char)
  g.px(x, y - 1, char)
  g.px(x + 2, y, char)
  g.px(x + 2, y - 1, char)
  g.px(x + 1, y, char)
}

function makeGrass(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'grass',
    walkable: true,
    frames: [
      (() => {
        const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'a')
        for (const [x, y] of [
          [4, 5],
          [16, 3],
          [25, 7],
          [9, 12],
          [21, 14],
          [29, 18],
          [5, 20],
          [13, 23],
          [24, 25],
          [3, 29],
          [17, 29],
        ] as const) {
          blade(g, x, y, 'b')
        }
        for (const [x, y] of [
          [11, 6],
          [28, 3],
          [7, 16],
          [19, 9],
          [26, 21],
          [10, 27],
          [22, 30],
          [2, 11],
        ] as const) {
          g.px(x, y, 'c')
        }
        // Sparse deep-shade specks give the moss a soft, uneven nap.
        for (const [x, y] of [
          [14, 17],
          [27, 12],
          [6, 25],
          [20, 27],
          [12, 2],
        ] as const) {
          g.px(x, y, 'd')
          g.px(x + 1, y, 'd')
        }
        return parsePixelArt(g.rows(), GRASS[time])
      })(),
    ],
  })
}

function makeMeadow(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'meadow',
    terrain: 'grass',
    walkable: true,
    frames: [
      (() => {
        const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'a')
        for (const [x, y] of [
          [3, 4],
          [12, 7],
          [22, 4],
          [28, 10],
          [7, 13],
          [17, 16],
          [26, 19],
          [4, 22],
          [13, 26],
          [23, 28],
          [29, 25],
          [9, 30],
          [19, 22],
        ] as const) {
          blade(g, x, y, 'b')
        }
        for (const [x, y] of [
          [8, 3],
          [18, 11],
          [2, 17],
          [24, 14],
          [11, 20],
          [28, 30],
          [15, 30],
        ] as const) {
          g.px(x, y, 'c')
        }
        for (const [x, y] of [
          [21, 8],
          [5, 9],
          [15, 19],
          [25, 24],
          [10, 24],
        ] as const) {
          g.px(x, y, 'd')
          g.px(x + 1, y, 'd')
        }
        return parsePixelArt(g.rows(), MEADOW[time])
      })(),
    ],
  })
}

const TALL_GRASS = {
  night: { ...GRASS.night, e: '#31402a', f: '#6a7a4f' },
  day: { ...GRASS.day, e: '#4d5f3a', f: '#8a9c63' },
} satisfies Record<TimeOfDay, Record<string, string>>

/** A tall-grass tuft: three blades with lighter tips. `lean` sways the tips. */
function tuft(g: CharGrid, x: number, y: number, lean: number): void {
  // Blade stems (bottom-anchored).
  g.fill(x, y - 3, 1, 4, 'e')
  g.fill(x + 3, y - 5, 1, 6, 'e')
  g.fill(x + 6, y - 4, 1, 5, 'e')
  // Tips lean with the breeze.
  g.px(x + lean, y - 4, 'f')
  g.px(x + 3 + lean, y - 6, 'f')
  g.px(x + 6 + lean, y - 5, 'f')
  // Base shadow.
  g.fill(x, y + 1, 7, 1, 'e')
}

function tallGrassFrame(time: TimeOfDay, lean: number) {
  const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'a')
  tuft(g, 3, 9, lean)
  tuft(g, 15, 7, -lean)
  tuft(g, 23, 12, lean)
  tuft(g, 6, 21, -lean)
  tuft(g, 17, 25, lean)
  tuft(g, 26, 22, -lean)
  g.px(11, 14, 'c')
  g.px(29, 5, 'c')
  g.px(2, 28, 'c')
  return parsePixelArt(g.rows(), TALL_GRASS[time])
}

function makeTallGrass(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'tall-grass',
    terrain: 'grass',
    walkable: true,
    frames: [tallGrassFrame(time, 0), tallGrassFrame(time, 1)],
  })
}

const FLOWERS = {
  night: {
    ...GRASS.night,
    r: '#a289bd', // dusk-lavender petals
    y: '#d9a561', // flower center
    w: '#ddd6b4', // moonlit cream petals
    o: '#c99553', // cream-flower center
    e: '#5a6a45', // stem
  },
  day: {
    ...GRASS.day,
    r: '#b79bd4',
    y: '#e0b060',
    w: '#f2ecc9',
    o: '#d4a15c',
    e: '#5f7347',
  },
} satisfies Record<TimeOfDay, Record<string, string>>

/**
 * A six-pixel bloom on a short stem. `spin` alternates the petals between
 * the cross and diagonal arrangement so the flowers appear to twirl.
 */
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
  g.fill(x + 2, y + 6, 1, 2, 'e') // stem
}

function flowersFrame(time: TimeOfDay, spin: boolean) {
  const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'a')
  bloom(g, 6, 5, 'r', 'y', spin)
  bloom(g, 20, 18, 'w', 'o', !spin)
  blade(g, 16, 9, 'b')
  blade(g, 5, 25, 'b')
  blade(g, 26, 7, 'b')
  g.px(12, 29, 'c')
  g.px(28, 27, 'c')
  return parsePixelArt(g.rows(), FLOWERS[time])
}

function makeFlowers(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'flowers',
    terrain: 'grass',
    walkable: true,
    frames: [flowersFrame(time, false), flowersFrame(time, true)],
  })
}

const FIREFLIES = {
  night: {
    ...GRASS.night,
    h: '#ffd98c', // firefly core
    i: '#f2b45faa', // firefly glow
    j: '#c98f4a55', // faint trailing glow
  },
  day: {
    ...GRASS.day,
    h: '#f2ecc9', // butterfly wings
    i: '#8a7358', // butterfly body
    j: '#d8cfa8', // wing shade
  },
} satisfies Record<TimeOfDay, Record<string, string>>

/** A firefly: a bright core pixel wrapped in a soft warm halo. */
function fly(g: CharGrid, x: number, y: number): void {
  g.px(x, y - 1, 'i')
  g.px(x, y + 1, 'i')
  g.px(x - 1, y, 'i')
  g.px(x + 1, y, 'i')
  g.px(x, y, 'h')
}

/** A butterfly: cream wings flapping around a tiny dark body. */
function butterfly(g: CharGrid, x: number, y: number, open: boolean): void {
  g.px(x, y, 'i')
  g.px(x, y + 1, 'i')
  if (open) {
    g.px(x - 1, y, 'h')
    g.px(x + 1, y, 'h')
    g.px(x - 1, y + 1, 'j')
    g.px(x + 1, y + 1, 'j')
  } else {
    g.px(x - 1, y - 1, 'h')
    g.px(x + 1, y - 1, 'h')
  }
}

function firefliesFrame(time: TimeOfDay, shift: boolean) {
  const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'a')
  for (const [x, y] of [
    [9, 12],
    [22, 6],
    [17, 24],
  ] as const) {
    blade(g, x, y, 'b')
  }
  g.px(27, 17, 'c')
  g.px(4, 26, 'c')
  if (time === 'night') {
    if (shift) {
      fly(g, 8, 7)
      fly(g, 24, 21)
      g.px(17, 15, 'j')
    } else {
      fly(g, 10, 9)
      fly(g, 22, 19)
      g.px(15, 14, 'j')
    }
  } else {
    // By day the same tile hosts butterflies instead.
    butterfly(g, 9, 8, shift)
    butterfly(g, 23, 20, !shift)
  }
  return parsePixelArt(g.rows(), FIREFLIES[time])
}

/** Grass with drifting fireflies at night; butterflies by day. */
function makeFireflies(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'fireflies',
    terrain: 'grass',
    walkable: true,
    frames: [firefliesFrame(time, false), firefliesFrame(time, true)],
  })
}

const PATH = {
  night: {
    s: '#6a5546', // packed earth
    t: '#57453a', // dark speck
    u: '#7b6553', // light speck
  },
  day: {
    s: '#8a7358',
    t: '#75604a',
    u: '#9c856a',
  },
} satisfies Record<TimeOfDay, Record<string, string>>

const PATH_RIM: Record<TimeOfDay, string> = {
  night: '#453729',
  day: '#5d4d3a',
}

function makePath(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'path',
    walkable: true,
    rim: PATH_RIM[time],
    frames: [
      (() => {
        const g = new CharGrid(TILE_SIZE, TILE_SIZE, 's')
        // Small pebbles: a dark dash with a light kiss on top.
        for (const [x, y] of [
          [5, 6],
          [18, 4],
          [27, 9],
          [10, 14],
          [22, 17],
          [4, 22],
          [15, 25],
          [26, 27],
          [8, 30],
        ] as const) {
          g.fill(x, y, 3, 2, 't')
          g.px(x, y, 'u')
        }
        for (const [x, y] of [
          [13, 8],
          [29, 3],
          [2, 12],
          [20, 22],
          [11, 20],
          [24, 31],
          [30, 20],
          [6, 27],
        ] as const) {
          g.px(x, y, 'u')
        }
        return parsePixelArt(g.rows(), PATH[time])
      })(),
    ],
  })
}

const WATER = {
  night: {
    w: '#2b3a41', // still, ink-dark water
    v: '#232f36', // ripple shadow
    x: '#8e9c86', // pale moonlight streak
    z: '#3d4f52', // faint mid ripple
  },
  day: {
    w: '#4a6b70',
    v: '#3d5a60',
    x: '#c9d8c2',
    z: '#5b7d80',
  },
} satisfies Record<TimeOfDay, Record<string, string>>

const WATER_RIM: Record<TimeOfDay, string> = {
  night: '#49594e',
  day: '#6b8a7a',
}

type Dash = readonly [x: number, y: number, w: number]

function waterFrame(
  time: TimeOfDay,
  light: readonly Dash[],
  mid: readonly Dash[],
  dark: readonly Dash[],
) {
  const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'w')
  for (const [x, y, w] of mid) {
    g.fill(x, y, w, 1, 'z')
  }
  for (const [x, y, w] of light) {
    g.fill(x, y, w, 1, 'x')
    // A hooked tip gives the classic wave glyph.
    g.px(x + w, y + 1, 'x')
  }
  for (const [x, y, w] of dark) {
    g.fill(x, y, w, 1, 'v')
  }
  return parsePixelArt(g.rows(), WATER[time])
}

function makeWater(time: TimeOfDay): TileDef {
  return defineTile({
    id: 'water',
    walkable: false,
    rim: WATER_RIM[time],
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
      ),
    ],
  })
}

/** All ground tiles for one lighting mood, keyed by tile id. */
export function groundTiles(time: TimeOfDay): Record<string, TileDef> {
  const tiles = [
    makeGrass(time),
    makeMeadow(time),
    makeTallGrass(time),
    makeFlowers(time),
    makeFireflies(time),
    makePath(time),
    makeWater(time),
  ]
  return Object.fromEntries(tiles.map((tile) => [tile.id, tile]))
}
