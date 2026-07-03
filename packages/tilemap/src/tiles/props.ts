import { CharGrid, parsePixelArt } from '../pixel-art.js';
import { defineProp } from '../tileset.js';
import type { PropDef } from '../tileset.js';

const TREE = {
  k: '#2c5530', // outline
  f: '#3c7a40', // leaf dark
  g: '#55a04c', // leaf mid
  h: '#79c065', // leaf light
  i: '#94d47c', // leaf glint
  q: '#7a4e32', // trunk
  p: '#955f3b', // trunk light
  n: '#5f3c26', // trunk shadow
  v: '#00000028', // soft shadow
};

// 32x64: the top tile row is overhang (draws above characters).
export const tree: PropDef = defineProp({
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
      // Canopy: outline, dark base, mid body, lit crown, glints.
      g.ellipse(16, 24, 15, 21, 'k');
      g.ellipse(16, 24, 13.5, 19.5, 'f');
      g.ellipse(14, 21, 11.5, 16, 'g');
      g.ellipse(12, 16, 7.5, 10, 'h');
      g.ellipse(10, 12, 3.5, 4, 'i');
      g.ellipse(22, 10, 2.5, 2.5, 'h');
      // Leaf clumps along the lower canopy for texture.
      g.ellipse(7, 33, 3, 2, 'f');
      g.ellipse(17, 36, 4, 2.5, 'f');
      g.ellipse(25, 30, 3, 2, 'f');
      return parsePixelArt(g.rows(), TREE);
    })(),
  ],
});

const ROCK = {
  m: '#b8b8aa', // body
  n: '#8c8c80', // outline / shade
  o: '#d8d8c8', // highlight
  d: '#a2a294', // mid shade
  v: '#00000028',
};

export const rock: PropDef = defineProp({
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
      return parsePixelArt(g.rows(), ROCK);
    })(),
  ],
});

const SIGN = {
  k: '#6b4a34', // frame
  u: '#d9a566', // board
  b: '#c8945a', // board grain
  q: '#8a5a3b', // lettering / post
  v: '#00000028',
};

export const sign: PropDef = defineProp({
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
      return parsePixelArt(g.rows(), SIGN);
    })(),
  ],
});
