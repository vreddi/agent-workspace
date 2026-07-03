import type { Tileset } from '../tileset.js';
import { flowers, grass, meadow, path, tallGrass, water } from './ground.js';
import { houseBlue, houseOrange, housePink } from './house.js';
import { rock, sign, tree } from './props.js';

export { flowers, grass, meadow, path, tallGrass, water } from './ground.js';
export { houseBlue, houseOrange, housePink, makeHouse } from './house.js';
export type { HouseVariant } from './house.js';
export { rock, sign, tree } from './props.js';

/** The built-in cozy GBA-style tileset. */
export const COZY_TILESET: Tileset = {
  tiles: {
    [grass.id]: grass,
    [meadow.id]: meadow,
    [tallGrass.id]: tallGrass,
    [flowers.id]: flowers,
    [path.id]: path,
    [water.id]: water,
  },
  props: {
    [tree.id]: tree,
    [rock.id]: rock,
    [sign.id]: sign,
    [housePink.id]: housePink,
    [houseBlue.id]: houseBlue,
    [houseOrange.id]: houseOrange,
  },
};
