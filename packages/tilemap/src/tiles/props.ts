import { CharGrid, parsePixelArt } from '../pixel-art.js';
import { defineProp } from '../tileset.js';
import type { PropDef } from '../tileset.js';
import type { TimeOfDay } from '../time.js';

const TREE = {
  night: {
    k: '#1d2a21', // outline
    f: '#28392c', // leaf dark
    g: '#354a35', // leaf mid
    h: '#43593e', // leaf light
    i: '#526a48', // leaf glint
    q: '#4b3a2d', // trunk
    p: '#5c4837', // trunk light
    n: '#3a2c21', // trunk shadow
    v: '#00000038', // soft shadow
  },
  day: {
    k: '#2c3e2b',
    f: '#3c5438',
    g: '#4d6a44',
    h: '#5f7f50',
    i: '#72945d',
    q: '#5d4836',
    p: '#6e5742',
    n: '#48372a',
    v: '#00000030',
  },
} satisfies Record<TimeOfDay, Record<string, string>>;

// 32x64: the top tile row is overhang (draws above characters).
function makeTree(time: TimeOfDay): PropDef {
  return defineProp({
    id: 'tree',
    tilesWide: 1,
    tilesHigh: 2,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 64);
        // Ground shadow.
        g.ellipse(16, 58, 12, 3, 'v');
        // Trunk with rounded root flare.
        g.fill(12, 42, 8, 16, 'k');
        g.fill(10, 54, 12, 4, 'k');
        g.fill(13, 43, 6, 14, 'q');
        g.fill(11, 55, 10, 2, 'q');
        g.fill(16, 43, 2, 13, 'p'); // light edge
        g.fill(13, 43, 2, 13, 'n'); // shaded edge
        // Canopy silhouette: a tall crown bulged by side clumps.
        g.ellipse(16, 22, 13, 19, 'k');
        g.ellipse(8, 30, 6, 7, 'k');
        g.ellipse(24, 28, 6.5, 8, 'k');
        g.ellipse(16, 22, 11.5, 17.5, 'f');
        g.ellipse(8, 30, 4.5, 5.5, 'f');
        g.ellipse(24, 28, 5, 6.5, 'f');
        // Interior clumps stepping up toward the lit crown.
        g.ellipse(13, 25, 8, 10, 'g');
        g.ellipse(21, 18, 6, 7, 'g');
        g.ellipse(8, 28, 3, 3.5, 'g');
        g.ellipse(13, 13, 6, 6.5, 'h');
        g.ellipse(19, 9, 3.5, 3.5, 'h');
        g.ellipse(11, 9, 2.5, 2.5, 'i');
        // Dark notches between clumps keep the foliage from reading flat.
        for (const [x, y] of [
          [17, 20], [11, 30], [22, 26], [15, 34], [25, 20],
        ] as const) {
          g.px(x, y, 'k');
          g.px(x + 1, y, 'k');
        }
        // Speckle across the crown.
        for (const [x, y] of [
          [16, 6], [8, 14], [21, 13], [14, 18], [24, 17], [6, 22],
        ] as const) {
          g.px(x, y, 'i');
        }
        return parsePixelArt(g.rows(), TREE[time]);
      })(),
    ],
  });
}

const PINE = {
  night: {
    k: '#16211d', // outline
    f: '#1f2f27', // needle dark
    g: '#293c30', // needle mid
    h: '#35493a', // needle light
    q: '#3c2f26', // trunk
    n: '#2c211a', // trunk shadow
    v: '#00000038',
  },
  day: {
    k: '#243529',
    f: '#2f4534',
    g: '#3b5640',
    h: '#4a684c',
    q: '#4a3a2e',
    n: '#392c22',
    v: '#00000030',
  },
} satisfies Record<TimeOfDay, Record<string, string>>;

/**
 * 32x96 conifer: two tile rows of overhang. Planted along the border it
 * layers into a dark treeline; tops clipping past the map edge read as the
 * forest continuing beyond the frame.
 */
function makePine(time: TimeOfDay): PropDef {
  return defineProp({
    id: 'pine',
    tilesWide: 1,
    tilesHigh: 3,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 96);
        g.ellipse(16, 90, 11, 3, 'v');
        // Trunk.
        g.fill(13, 74, 6, 16, 'k');
        g.fill(14, 75, 4, 14, 'q');
        g.fill(14, 75, 1, 14, 'n');
        // Three stacked triangular tiers, widest at the bottom.
        const tiers: ReadonlyArray<
          readonly [top: number, bottom: number, half: number]
        > = [
          [4, 30, 9],
          [22, 54, 12],
          [44, 80, 15],
        ];
        for (const [top, bottom, half] of tiers) {
          for (let y = top; y <= bottom; y++) {
            const t = (y - top) / (bottom - top);
            const w = Math.max(1, Math.round(t * half));
            g.fill(16 - w, y, w * 2, 1, 'k');
            if (w > 1) g.fill(16 - w + 1, y, w * 2 - 2, 1, 'f');
          }
        }
        // Mid tone up the lit (left) flank of each tier.
        for (const [top, bottom, half] of tiers) {
          for (let y = top + 2; y <= bottom - 1; y++) {
            const t = (y - top) / (bottom - top);
            const w = Math.max(1, Math.round(t * half) - 2);
            if (w < 1) continue;
            g.fill(16 - w, y, Math.max(1, Math.floor(w * 0.9)), 1, 'g');
          }
        }
        // Sparse light needles catching the light.
        for (const [x, y] of [
          [15, 10],
          [12, 26],
          [17, 34],
          [10, 48],
          [19, 58],
          [8, 70],
          [14, 66],
        ] as const) {
          g.px(x, y, 'h');
        }
        return parsePixelArt(g.rows(), PINE[time]);
      })(),
    ],
  });
}

const BUSH = {
  night: {
    k: '#4a2c19', // outline
    f: '#7c4623', // leaf dark
    g: '#9c5a2c', // leaf mid
    h: '#b8712f', // leaf light
    i: '#cf8a41', // leaf glint
    v: '#00000038',
  },
  day: {
    k: '#5f3a1e',
    f: '#96562a',
    g: '#b06a33',
    h: '#c9823c',
    i: '#dc9a4e',
    v: '#00000030',
  },
} satisfies Record<TimeOfDay, Record<string, string>>;

/** A low autumn shrub — the rust-orange accent note in the palette. */
function makeBushAutumn(time: TimeOfDay): PropDef {
  return defineProp({
    id: 'bush-autumn',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 32);
        g.ellipse(16, 27, 12, 3, 'v');
        // Irregular silhouette from three overlapping clumps.
        g.ellipse(10, 20, 8, 7, 'k');
        g.ellipse(22, 21, 8, 6.5, 'k');
        g.ellipse(16, 15, 7, 6, 'k');
        g.ellipse(10, 20, 6.5, 5.5, 'f');
        g.ellipse(22, 21, 6.5, 5, 'f');
        g.ellipse(16, 15, 5.5, 4.5, 'f');
        // Each clump lit from its own crown.
        g.ellipse(9, 18, 4.5, 3.5, 'g');
        g.ellipse(21, 19, 4.5, 3, 'g');
        g.ellipse(15, 13, 4, 3, 'g');
        g.ellipse(8, 16.5, 2.5, 1.5, 'h');
        g.ellipse(14, 11.5, 2.5, 1.5, 'h');
        g.ellipse(21, 17.5, 2, 1.2, 'h');
        // Leaf glints and dark leaf notches for texture.
        for (const [x, y] of [
          [7, 15], [13, 10], [20, 16], [25, 19],
        ] as const) {
          g.px(x, y, 'i');
        }
        for (const [x, y] of [
          [12, 18], [17, 21], [22, 24], [9, 23], [16, 17],
        ] as const) {
          g.px(x, y, 'k');
          g.px(x + 1, y + 1, 'k');
        }
        return parsePixelArt(g.rows(), BUSH[time]);
      })(),
    ],
  });
}

const LANTERN = {
  night: {
    k: '#26211c', // ironwork
    q: '#33291f', // post
    p: '#453728', // post light edge
    y: '#f5b95e', // glass
    z: '#ffe0a1', // flame core
    o: '#f2a94d2b', // outer glow
    w: '#f7c06a55', // inner glow
    v: '#00000038',
  },
  day: {
    k: '#33291f',
    q: '#453728',
    p: '#594733',
    y: '#cfc9b4', // cold glass
    z: '#8a8474', // unlit wick
    o: '#00000000',
    w: '#00000000',
    v: '#00000030',
  },
} satisfies Record<TimeOfDay, Record<string, string>>;

/** 32x64 lantern post; at night the head glows and flickers. */
function lanternFrame(time: TimeOfDay, flare: boolean) {
  const g = new CharGrid(32, 64);
  g.ellipse(16, 59, 8, 2, 'v');
  if (time === 'night') {
    // Warm pool of light, cast wide across whatever stands nearby.
    g.ellipse(16, 20, flare ? 13 : 11, flare ? 13 : 11, 'o');
    g.ellipse(16, 20, flare ? 8 : 6.5, flare ? 8 : 6.5, 'w');
  }
  // Post with a light edge; a small crossbar under the head.
  g.fill(14, 26, 4, 32, 'q');
  g.fill(14, 26, 1, 32, 'p');
  g.fill(10, 26, 12, 2, 'k');
  // Head: iron cap, glass box, flame.
  g.fill(12, 10, 8, 2, 'k');
  g.fill(14, 8, 4, 2, 'k');
  g.fill(12, 12, 2, 10, 'k');
  g.fill(18, 12, 2, 10, 'k');
  g.fill(12, 22, 8, 2, 'k');
  g.fill(14, 12, 4, 10, 'y');
  g.fill(15, flare ? 14 : 15, 2, flare ? 5 : 4, 'z');
  return parsePixelArt(g.rows(), LANTERN[time]);
}

function makeLantern(time: TimeOfDay): PropDef {
  return defineProp({
    id: 'lantern',
    tilesWide: 1,
    tilesHigh: 2,
    baseRows: 1,
    frames:
      time === 'night'
        ? [lanternFrame(time, false), lanternFrame(time, true)]
        : [lanternFrame(time, false)],
  });
}

const ROCK = {
  night: {
    m: '#59614f', // body
    n: '#3d423a', // outline / shade
    o: '#6d7660', // highlight
    d: '#4a5142', // mid shade
    g: '#465538', // moss patch
    v: '#00000038',
  },
  day: {
    m: '#6d7663',
    n: '#4d5347',
    o: '#828c74',
    d: '#5d6552',
    g: '#5a6b44',
    v: '#00000030',
  },
} satisfies Record<TimeOfDay, Record<string, string>>;

function makeRock(time: TimeOfDay): PropDef {
  return defineProp({
    id: 'rock',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 32);
        g.ellipse(16, 27, 12, 3, 'v'); // shadow
        g.ellipse(16, 17, 12, 9, 'n'); // outline
        g.ellipse(16, 16.5, 10.5, 7.5, 'm'); // body
        g.ellipse(20, 19, 6, 4, 'd'); // lower-right shade
        g.ellipse(11, 12, 4.5, 3, 'o'); // top-left highlight
        g.px(19, 12, 'o');
        g.px(20, 12, 'o');
        // A crack line for character.
        g.px(17, 15, 'n');
        g.px(18, 16, 'n');
        g.px(18, 17, 'n');
        g.px(19, 18, 'n');
        // Moss creeping up the shaded side.
        g.ellipse(22, 21, 3, 2, 'g');
        g.px(9, 20, 'g');
        g.px(10, 21, 'g');
        return parsePixelArt(g.rows(), ROCK[time]);
      })(),
    ],
  });
}

const STUMP = {
  night: {
    t: '#8a6e50', // cut face
    r: '#6b543d', // growth rings
    q: '#48372a', // bark
    n: '#382a1f', // bark shadow
    g: '#465538', // moss
    v: '#00000038',
  },
  day: {
    t: '#a08059',
    r: '#7d6247',
    q: '#59452f',
    n: '#48372a',
    g: '#5a6b44',
    v: '#00000030',
  },
} satisfies Record<TimeOfDay, Record<string, string>>;

function makeStump(time: TimeOfDay): PropDef {
  return defineProp({
    id: 'stump',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 32);
        g.ellipse(16, 27, 11, 3, 'v');
        // Bark body with a root flare.
        g.fill(8, 16, 16, 10, 'q');
        g.fill(6, 24, 20, 2, 'q');
        g.fill(8, 16, 3, 10, 'n');
        g.fill(21, 16, 3, 10, 'n');
        // Cut face: an ellipse with rings.
        g.ellipse(16, 14, 10, 5, 'n');
        g.ellipse(16, 13.5, 8.5, 4, 't');
        g.ellipse(16, 13.5, 5, 2.2, 'r');
        g.ellipse(16, 13.5, 2, 0.8, 't');
        g.px(16, 13, 'r');
        // Moss on the shaded shoulder.
        g.ellipse(10, 18, 2.5, 1.5, 'g');
        g.px(22, 20, 'g');
        return parsePixelArt(g.rows(), STUMP[time]);
      })(),
    ],
  });
}

const SHROOM = {
  night: {
    c: '#b5763f', // cap
    h: '#c98a4a', // cap light
    s: '#d8c9a5', // stalk
    d: '#8a6e50', // stalk shade
    w: '#e6d9b5', // cap spots
    v: '#00000028',
  },
  day: {
    c: '#c98a4a',
    h: '#dc9f58',
    s: '#e8dcbc',
    d: '#a08059',
    w: '#f2e8ce',
    v: '#00000020',
  },
} satisfies Record<TimeOfDay, Record<string, string>>;

/** A little cluster of woodland mushrooms. Decorative — walkable. */
function makeMushrooms(time: TimeOfDay): PropDef {
  return defineProp({
    id: 'mushrooms',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    walkable: true,
    frames: [
      (() => {
        const g = new CharGrid(32, 32);
        g.ellipse(15, 28, 9, 2, 'v');
        // Tall mushroom.
        g.fill(11, 18, 3, 8, 's');
        g.fill(13, 18, 1, 8, 'd');
        g.ellipse(12, 15, 6, 4, 'c');
        g.ellipse(10, 13.5, 3, 1.8, 'h');
        g.px(9, 15, 'w');
        g.px(14, 13, 'w');
        // Short mushroom leaning right.
        g.fill(21, 22, 3, 5, 's');
        g.fill(23, 22, 1, 5, 'd');
        g.ellipse(22, 20, 4.5, 3, 'c');
        g.ellipse(21, 18.5, 2.2, 1.2, 'h');
        g.px(24, 19, 'w');
        return parsePixelArt(g.rows(), SHROOM[time]);
      })(),
    ],
  });
}

const SIGN = {
  night: {
    k: '#382c21', // frame
    u: '#6d5843', // board
    b: '#5d4936', // board grain
    q: '#43352a', // lettering / post
    v: '#00000038',
  },
  day: {
    k: '#4a3a2a',
    u: '#8a7154',
    b: '#78614a',
    q: '#54432f',
    v: '#00000030',
  },
} satisfies Record<TimeOfDay, Record<string, string>>;

function makeSign(time: TimeOfDay): PropDef {
  return defineProp({
    id: 'sign',
    tilesWide: 1,
    tilesHigh: 1,
    baseRows: 1,
    frames: [
      (() => {
        const g = new CharGrid(32, 32);
        g.ellipse(16, 28, 9, 2, 'v'); // shadow
        // Post.
        g.fill(14, 18, 4, 10, 'k');
        g.fill(15, 18, 2, 9, 'q');
        // Board with frame and wood grain.
        g.fill(3, 4, 26, 14, 'k');
        g.fill(5, 6, 22, 10, 'u');
        g.fill(5, 10, 22, 1, 'b');
        // Lettering dashes.
        g.fill(7, 8, 6, 1, 'q');
        g.fill(15, 8, 8, 1, 'q');
        g.fill(7, 12, 10, 1, 'q');
        g.fill(19, 12, 5, 1, 'q');
        return parsePixelArt(g.rows(), SIGN[time]);
      })(),
    ],
  });
}

/** All decorative props for one lighting mood, keyed by prop id. */
export function propTiles(time: TimeOfDay): Record<string, PropDef> {
  const props = [
    makeTree(time),
    makePine(time),
    makeBushAutumn(time),
    makeLantern(time),
    makeRock(time),
    makeStump(time),
    makeMushrooms(time),
    makeSign(time),
  ];
  return Object.fromEntries(props.map((prop) => [prop.id, prop]));
}
