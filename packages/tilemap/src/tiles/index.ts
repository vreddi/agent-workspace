import type { Tileset } from '../tileset.js';
import type { TimeOfDay } from '../time.js';
import { groundTiles } from './ground.js';
import { houseTiles } from './house.js';
import { propTiles } from './props.js';

export { groundTiles } from './ground.js';
export { HOUSE_VARIANTS, houseTiles, makeHouse } from './house.js';
export type { HouseVariant } from './house.js';
export { propTiles } from './props.js';

const CACHE = new Map<TimeOfDay, Tileset>();

/**
 * The built-in cozy village tileset in the requested lighting mood. Both
 * moods share tile/prop ids, so maps parse identically against either.
 * Results are cached so repeated calls return stable identities.
 */
export function makeCozyTileset(time: TimeOfDay = 'night'): Tileset {
  const cached = CACHE.get(time);
  if (cached) return cached;
  const tileset: Tileset = {
    tiles: groundTiles(time),
    props: { ...propTiles(time), ...houseTiles(time) },
  };
  CACHE.set(time, tileset);
  return tileset;
}

/** The signature night look — lit windows, glowing lanterns, fireflies. */
export const COZY_TILESET: Tileset = makeCozyTileset('night');
