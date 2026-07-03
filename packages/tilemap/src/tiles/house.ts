import { CharGrid, parsePixelArt } from '../pixel-art.js';
import { defineProp } from '../tileset.js';
import type { PropDef } from '../tileset.js';

/**
 * Houses are 3x3 tiles (96x96 art at native sprite density): the roof peak
 * (top tile row) is overhang, the bottom two rows block movement. Geometry
 * is built programmatically so the three color variants share one template.
 */

const SIZE = 96;

function houseRows(): string[] {
  const g = new CharGrid(SIZE, SIZE);

  // Stepped gable roof. R = roof, L = highlight, S = shadow, K = trim.
  g.fill(28, 8, 40, 4, 'R');
  g.fill(20, 12, 56, 4, 'R');
  g.fill(12, 16, 72, 4, 'R');
  g.fill(4, 20, 88, 4, 'R');
  g.fill(0, 24, 96, 16, 'R');
  // Ridge gloss.
  g.fill(30, 9, 26, 2, 'L');
  g.fill(22, 13, 14, 2, 'L');
  g.fill(14, 17, 8, 2, 'L');
  // Shingle seams.
  g.fill(12, 19, 72, 1, 'S');
  g.fill(4, 23, 88, 1, 'S');
  g.fill(0, 31, 96, 1, 'S');
  // Under-eave shade and eave edge.
  g.fill(0, 36, 96, 4, 'S');
  g.fill(0, 40, 96, 4, 'K');

  // Walls. W = wall, V = wall shade, K = trim.
  g.fill(6, 44, 84, 48, 'W');
  g.fill(6, 44, 84, 3, 'V');
  g.fill(6, 44, 2, 48, 'K');
  g.fill(88, 44, 2, 48, 'K');
  // Plank seams.
  g.fill(8, 60, 80, 1, 'V');
  g.fill(8, 76, 80, 1, 'V');
  // Foundation.
  g.fill(6, 88, 84, 4, 'V');
  g.fill(4, 92, 88, 4, 'K');

  // Windows with cross panes and a sill.
  for (const wx of [16, 64]) {
    g.fill(wx, 52, 16, 16, 'K');
    g.fill(wx + 2, 54, 12, 12, 'B');
    g.fill(wx + 2, 54, 4, 3, 'E'); // glass shine
    g.fill(wx + 7, 54, 2, 12, 'K'); // vertical pane bar
    g.fill(wx + 2, 59, 12, 2, 'K'); // horizontal pane bar
    g.fill(wx - 1, 68, 18, 2, 'V'); // sill
  }

  // Arched door, centered on the middle tile.
  g.fill(40, 64, 16, 28, 'K');
  g.fill(42, 62, 12, 2, 'K'); // arch shoulder
  g.fill(44, 60, 8, 2, 'K'); // arch crown
  g.fill(42, 66, 12, 26, 'Q');
  g.fill(44, 64, 8, 2, 'Q');
  g.fill(44, 68, 8, 8, 'P'); // upper panel
  g.fill(44, 80, 8, 8, 'P'); // lower panel
  g.fill(52, 77, 2, 3, 'Y'); // handle
  // Door step.
  g.fill(38, 92, 20, 4, 'V');

  return g.rows();
}

const HOUSE_ROWS = houseRows();

const BASE_PALETTE = {
  W: '#f2e3c2', // wall
  V: '#dcc9a0', // wall shade
  K: '#6b4a34', // trim / outline
  Q: '#8a5a3b', // door
  P: '#a06c46', // door panel
  Y: '#f7d54a', // handle
  B: '#aadcf5', // window glass
  E: '#e8f7ff', // glass shine
};

export type HouseVariant = {
  id: string;
  roof: string;
  roofHighlight: string;
  roofShadow: string;
};

export function makeHouse(variant: HouseVariant): PropDef {
  return defineProp({
    id: variant.id,
    tilesWide: 3,
    tilesHigh: 3,
    baseRows: 2,
    frames: [
      parsePixelArt(HOUSE_ROWS, {
        ...BASE_PALETTE,
        R: variant.roof,
        L: variant.roofHighlight,
        S: variant.roofShadow,
      }),
    ],
  });
}

export const housePink = makeHouse({
  id: 'house-pink',
  roof: '#e8798f',
  roofHighlight: '#f2a0b0',
  roofShadow: '#c95c74',
});

export const houseBlue = makeHouse({
  id: 'house-blue',
  roof: '#6f9fe8',
  roofHighlight: '#93b8f2',
  roofShadow: '#5482cc',
});

export const houseOrange = makeHouse({
  id: 'house-orange',
  roof: '#e8a054',
  roofHighlight: '#f2bc78',
  roofShadow: '#c9823c',
});
