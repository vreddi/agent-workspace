import { CharGrid, parsePixelArt } from '../pixel-art.js';
import { defineProp } from '../tileset.js';
import type { PropDef } from '../tileset.js';
import type { TimeOfDay } from '../time.js';

/**
 * Timber cabins, 3x3 tiles (96x96 art at native sprite density): the top
 * tile row is overhang (roof peak, chimney, smoke), the bottom two rows
 * block movement. Geometry is built programmatically so the roof-color
 * variants share one template; two frames drift the chimney smoke. At
 * night the windows glow amber and spill lamplight onto the logs; by day
 * the glass goes cool and the lights stay off.
 */

const SIZE = 96;

function cabinRows(smokePhase: 0 | 1, time: TimeOfDay): string[] {
  const g = new CharGrid(SIZE, SIZE);

  // Gable roof with smooth diagonal edges: half-width grows linearly from
  // the ridge (y=10) to full-width eaves (y=44). R = roof, L = highlight,
  // S = shadow, K = trim.
  const RIDGE_Y = 10;
  const EAVE_Y = 44;
  const half = (y: number) =>
    Math.round(8 + ((y - RIDGE_Y) * 40) / (EAVE_Y - RIDGE_Y));
  for (let y = RIDGE_Y; y < EAVE_Y; y++) {
    const w = half(y);
    g.fill(48 - w, y, w * 2, 1, 'R');
    // Dark trim tracing the sloped edges.
    g.fill(48 - w, y, 2, 1, 'K');
    g.fill(48 + w - 2, y, 2, 1, 'K');
  }
  // Ridge cap and a soft gloss line under it.
  g.fill(40, RIDGE_Y - 1, 16, 2, 'K');
  g.fill(41, RIDGE_Y + 1, 14, 2, 'L');
  // Shingle courses: shadow seams every six rows, kept inside the trim.
  for (const y of [17, 23, 29, 35] as const) {
    const w = half(y) - 2;
    g.fill(48 - w, y, w * 2, 1, 'S');
  }
  // Staggered shingle ticks between the seams.
  for (const [x, y] of [
    [38, 19], [50, 19], [60, 19],
    [30, 25], [44, 25], [58, 25], [68, 25],
    [22, 31], [36, 31], [52, 31], [66, 31], [76, 31],
    [14, 37], [28, 37], [44, 37], [60, 37], [74, 37], [84, 37],
  ] as const) {
    g.fill(x, y, 1, 3, 'S');
  }
  // Under-eave shade and eave trim board.
  g.fill(2, 40, 92, 4, 'S');
  g.fill(0, 44, 96, 2, 'K');

  // Stone chimney rising through the right slope. F = stone, Z = joint,
  // O = lit stone.
  g.fill(63, 6, 20, 4, 'Z');
  g.fill(64, 6, 18, 2, 'O');
  g.fill(65, 10, 16, 24, 'F');
  g.fill(65, 10, 2, 24, 'Z');
  for (const y of [14, 19, 24, 29] as const) {
    g.fill(67, y, 14, 1, 'Z');
  }
  for (const [x, y] of [
    [70, 11], [76, 16], [69, 21], [75, 26],
  ] as const) {
    g.fill(x, y, 3, 2, 'O');
  }
  // Smoke drifting off the chimney mouth; the two frames alternate wisps.
  if (smokePhase === 0) {
    g.ellipse(72, 4, 3, 1.5, 'M');
    g.ellipse(77, 2, 2.5, 1.2, 'm');
    g.ellipse(69, 0, 2, 1, 'm');
    g.px(82, 0, 'm');
  } else {
    g.ellipse(74, 4, 3, 1.5, 'M');
    g.ellipse(69, 2, 2.5, 1.2, 'm');
    g.ellipse(79, 0, 2, 1, 'm');
    g.px(65, 1, 'm');
  }

  // Log walls: seven 6px courses between eave and foundation.
  // W = log face, X = log light, V = seam / shade.
  g.fill(6, 46, 84, 42, 'W');
  if (time === 'night') {
    // Warm lamplight blooming through the wall around each window.
    g.ellipse(22, 60, 15, 11, '1');
    g.ellipse(22, 60, 11, 8, '2');
    g.ellipse(74, 60, 15, 11, '1');
    g.ellipse(74, 60, 11, 8, '2');
  }
  // Course highlights and seams (drawn over the glow so the texture holds).
  for (let course = 0; course < 7; course++) {
    const y = 46 + course * 6;
    g.fill(6, y, 84, 1, 'X');
    g.fill(6, y + 5, 84, 1, 'V');
  }
  // Corner posts with notched log ends.
  g.fill(6, 46, 3, 42, 'K');
  g.fill(87, 46, 3, 42, 'K');
  for (let course = 0; course < 7; course++) {
    const y = 46 + course * 6;
    g.px(7, y + 2, 'V');
    g.px(88, y + 2, 'V');
  }

  // Windows: four-pane casements with sills — amber-lit after dark.
  for (const wx of [14, 66]) {
    g.fill(wx, 52, 16, 16, 'K');
    g.fill(wx + 2, 54, 12, 12, 'B');
    g.fill(wx + 2, 54, 12, 4, 'E'); // bright upper glass
    g.fill(wx + 7, 54, 2, 12, 'K'); // vertical pane bar
    g.fill(wx + 2, 59, 12, 2, 'K'); // horizontal pane bar
    g.fill(wx - 1, 68, 18, 2, 'V'); // sill
  }

  // Arched plank door with a tiny lamp above the lintel.
  g.fill(40, 62, 16, 26, 'K');
  g.fill(42, 60, 12, 2, 'K'); // arch shoulder
  g.fill(44, 58, 8, 2, 'K'); // arch crown
  g.fill(42, 64, 12, 24, 'Q');
  g.fill(44, 62, 8, 2, 'Q');
  for (const px of [45, 48, 51] as const) {
    g.fill(px, 63, 1, 25, 'P'); // plank seams
  }
  g.fill(52, 75, 2, 3, 'Y'); // handle
  g.fill(46, 53, 4, 4, 'K'); // lamp bracket
  g.fill(47, 54, 2, 2, 'Y'); // lamp glass

  // Fieldstone foundation and door step.
  g.fill(4, 88, 88, 8, 'F');
  g.fill(4, 88, 88, 1, 'Z');
  for (const [x, y, w] of [
    [8, 91, 6], [22, 93, 7], [37, 90, 6], [52, 92, 7], [68, 90, 6], [80, 93, 6],
  ] as const) {
    g.fill(x, y, w, 1, 'Z');
  }
  for (const [x, y] of [
    [14, 89], [44, 89], [74, 92], [28, 91], [60, 93],
  ] as const) {
    g.fill(x, y, 3, 1, 'O');
  }
  g.fill(38, 88, 20, 3, 'O'); // worn stone step at the door

  return g.rows();
}

const CABIN_ROWS: Record<TimeOfDay, readonly [string[], string[]]> = {
  night: [cabinRows(0, 'night'), cabinRows(1, 'night')],
  day: [cabinRows(0, 'day'), cabinRows(1, 'day')],
};

const BASE_PALETTE: Record<TimeOfDay, Record<string, string>> = {
  night: {
    K: '#33261d', // trim / outline
    W: '#5f4938', // log face
    X: '#6d5544', // log light
    V: '#463527', // log seam / shade
    '1': '#6d5240', // lamplight on logs, outer
    '2': '#7d5f45', // lamplight on logs, inner
    Q: '#3b2c21', // door planks
    P: '#332419', // plank seam
    Y: '#f2b45f', // handle / lamp glass
    B: '#f2ac55', // window glass
    E: '#ffd28a', // bright glass
    F: '#55554d', // stone
    Z: '#44443d', // stone joint
    O: '#67675e', // lit stone
    M: '#c9c3b76e', // smoke
    m: '#d8d3c84d', // thin smoke
  },
  day: {
    K: '#3f3024',
    W: '#6d5544',
    X: '#7d654f',
    V: '#54422f',
    '1': '#6d5544', // unused by day (no lamplight bloom)
    '2': '#6d5544',
    Q: '#48372a',
    P: '#3b2c20',
    Y: '#c9a860', // brass, unlit
    B: '#9db6b8', // cool daytime glass
    E: '#c9dbd8', // sky reflection
    F: '#67675c',
    Z: '#54544a',
    O: '#7d7d70',
    M: '#d8d3c86e',
    m: '#e5e0d54d',
  },
};

type RoofColors = {
  roof: string;
  highlight: string;
  shadow: string;
};

export type HouseVariant = {
  id: string;
  roofs: Record<TimeOfDay, RoofColors>;
};

export function makeHouse(variant: HouseVariant, time: TimeOfDay): PropDef {
  const roof = variant.roofs[time];
  const palette = {
    ...BASE_PALETTE[time],
    R: roof.roof,
    L: roof.highlight,
    S: roof.shadow,
  };
  return defineProp({
    id: variant.id,
    tilesWide: 3,
    tilesHigh: 3,
    baseRows: 2,
    frames: CABIN_ROWS[time].map((rows) => parsePixelArt(rows, palette)),
  });
}

export const HOUSE_VARIANTS: readonly HouseVariant[] = [
  {
    id: 'house-moss',
    roofs: {
      night: { roof: '#44543f', highlight: '#52644b', shadow: '#374434' },
      day: { roof: '#57694c', highlight: '#66795a', shadow: '#47563e' },
    },
  },
  {
    id: 'house-slate',
    roofs: {
      night: { roof: '#4d5168', highlight: '#5b6079', shadow: '#3f4356' },
      day: { roof: '#5d637f', highlight: '#6e7492', shadow: '#4c516a' },
    },
  },
  {
    id: 'house-rust',
    roofs: {
      night: { roof: '#7a4c30', highlight: '#8d5c3c', shadow: '#653e28' },
      day: { roof: '#8d5c3a', highlight: '#a06c46', shadow: '#754a2e' },
    },
  },
];

/** The three cabin variants for one lighting mood, keyed by prop id. */
export function houseTiles(time: TimeOfDay): Record<string, PropDef> {
  return Object.fromEntries(
    HOUSE_VARIANTS.map((variant) => [variant.id, makeHouse(variant, time)]),
  );
}
