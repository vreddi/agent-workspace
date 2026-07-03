import { CharGrid, parsePixelArt } from '../pixel-art.js';
import { TILE_SIZE, defineTile } from '../tileset.js';
import type { TileDef } from '../tileset.js';

// Shared meadow palette.
const G = {
  a: '#8fc463', // grass base
  b: '#7db052', // grass dark blade
  c: '#9ed172', // grass light fleck
};

/** A tiny two-blade grass tuft, the classic GBA ground motif. */
function blade(g: CharGrid, x: number, y: number, char: string): void {
  g.px(x, y, char);
  g.px(x, y - 1, char);
  g.px(x + 2, y, char);
  g.px(x + 2, y - 1, char);
  g.px(x + 1, y, char);
}

export const grass: TileDef = defineTile({
  id: 'grass',
  walkable: true,
  frames: [
    (() => {
      const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'a');
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
        blade(g, x, y, 'b');
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
        g.px(x, y, 'c');
      }
      return parsePixelArt(g.rows(), G);
    })(),
  ],
});

export const meadow: TileDef = defineTile({
  id: 'meadow',
  terrain: 'grass',
  walkable: true,
  frames: [
    (() => {
      const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'a');
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
        blade(g, x, y, 'b');
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
        g.px(x, y, 'c');
      }
      return parsePixelArt(g.rows(), G);
    })(),
  ],
});

const TG = { ...G, d: '#5f9c40', e: '#6fae4b' };

/** A tall-grass tuft: three blades with lighter tips. `lean` sways the tips. */
function tuft(g: CharGrid, x: number, y: number, lean: number): void {
  // Blade stems (bottom-anchored).
  g.fill(x, y - 3, 1, 4, 'd');
  g.fill(x + 3, y - 5, 1, 6, 'd');
  g.fill(x + 6, y - 4, 1, 5, 'd');
  // Tips lean with the breeze.
  g.px(x + lean, y - 4, 'e');
  g.px(x + 3 + lean, y - 6, 'e');
  g.px(x + 6 + lean, y - 5, 'e');
  // Base shadow.
  g.fill(x, y + 1, 7, 1, 'd');
}

function tallGrassFrame(lean: number) {
  const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'a');
  tuft(g, 3, 9, lean);
  tuft(g, 15, 7, -lean);
  tuft(g, 23, 12, lean);
  tuft(g, 6, 21, -lean);
  tuft(g, 17, 25, lean);
  tuft(g, 26, 22, -lean);
  g.px(11, 14, 'c');
  g.px(29, 5, 'c');
  g.px(2, 28, 'c');
  return parsePixelArt(g.rows(), TG);
}

export const tallGrass: TileDef = defineTile({
  id: 'tall-grass',
  terrain: 'grass',
  walkable: true,
  frames: [tallGrassFrame(0), tallGrassFrame(1)],
});

const FL = {
  ...G,
  r: '#e0525e', // red petals
  y: '#f7d54a', // flower center
  w: '#f7f7ef', // white petals
  o: '#f2c14e', // white-flower center
  e: '#6fae4b', // stem
};

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
  g.fill(x + 2, y + 2, 2, 2, center);
  if (spin) {
    g.fill(x + 2, y - 1, 2, 2, petal);
    g.fill(x + 2, y + 5, 2, 2, petal);
    g.fill(x - 1, y + 2, 2, 2, petal);
    g.fill(x + 5, y + 2, 2, 2, petal);
  } else {
    g.fill(x, y, 2, 2, petal);
    g.fill(x + 4, y, 2, 2, petal);
    g.fill(x, y + 4, 2, 2, petal);
    g.fill(x + 4, y + 4, 2, 2, petal);
  }
  g.fill(x + 2, y + 6, 1, 2, 'e'); // stem
}

function flowersFrame(spin: boolean) {
  const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'a');
  bloom(g, 6, 5, 'r', 'y', spin);
  bloom(g, 20, 18, 'w', 'o', !spin);
  blade(g, 16, 9, 'b');
  blade(g, 5, 25, 'b');
  blade(g, 26, 7, 'b');
  g.px(12, 29, 'c');
  g.px(28, 27, 'c');
  return parsePixelArt(g.rows(), FL);
}

export const flowers: TileDef = defineTile({
  id: 'flowers',
  terrain: 'grass',
  walkable: true,
  frames: [flowersFrame(false), flowersFrame(true)],
});

const PA = {
  s: '#e5cfa0', // packed sand
  t: '#d5bc84', // dark speck
  u: '#f0dfb5', // light speck
};

export const path: TileDef = defineTile({
  id: 'path',
  walkable: true,
  rim: '#cdb47e',
  frames: [
    (() => {
      const g = new CharGrid(TILE_SIZE, TILE_SIZE, 's');
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
        g.fill(x, y, 3, 2, 't');
        g.px(x, y, 'u');
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
        g.px(x, y, 'u');
      }
      return parsePixelArt(g.rows(), PA);
    })(),
  ],
});

const WA = {
  w: '#58a8f0', // water base
  v: '#4691dc', // ripple shadow
  x: '#a8dcf8', // sparkle
};

type Dash = readonly [x: number, y: number, w: number];

function waterFrame(light: readonly Dash[], dark: readonly Dash[]) {
  const g = new CharGrid(TILE_SIZE, TILE_SIZE, 'w');
  for (const [x, y, w] of light) {
    g.fill(x, y, w, 1, 'x');
    // A hooked tip gives the classic wave glyph.
    g.px(x + w, y + 1, 'x');
  }
  for (const [x, y, w] of dark) {
    g.fill(x, y, w, 1, 'v');
  }
  return parsePixelArt(g.rows(), WA);
}

export const water: TileDef = defineTile({
  id: 'water',
  walkable: false,
  rim: '#bfe4fb',
  frames: [
    waterFrame(
      [
        [4, 5, 5],
        [18, 3, 4],
        [26, 10, 4],
        [9, 14, 5],
        [21, 19, 5],
        [4, 24, 4],
        [15, 28, 5],
      ],
      [
        [12, 8, 4],
        [24, 15, 4],
        [7, 19, 3],
        [18, 24, 4],
        [28, 27, 3],
      ],
    ),
    waterFrame(
      [
        [6, 6, 5],
        [20, 4, 4],
        [27, 12, 4],
        [11, 15, 5],
        [23, 20, 5],
        [6, 25, 4],
        [17, 29, 5],
      ],
      [
        [14, 9, 4],
        [26, 16, 4],
        [9, 20, 3],
        [20, 25, 4],
        [3, 12, 3],
      ],
    ),
  ],
});
