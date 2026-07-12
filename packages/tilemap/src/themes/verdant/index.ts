import type { Tileset } from '../../tileset.js'
import type { TimeOfDay } from '../../time.js'
import { verdantGround } from './ground.js'
import { verdantHouses } from './houses.js'
import { verdantProps } from './props.js'
import { verdantTrees } from './trees.js'

export { verdantGround } from './ground.js'
export { verdantTrees } from './trees.js'
export { verdantProps } from './props.js'
export { verdantHouses, VERDANT_HOUSES } from './houses.js'
export type { VerdantHouse } from './houses.js'

const CACHE = new Map<TimeOfDay, Tileset>()

/**
 * The "verdant" theme pack — a Sea-of-Stars / Chained-Echoes painterly look:
 * rich material ramps, hue-shifted shadows, golden-hour days and cool indigo
 * nights where warm window and lamp light pops. Both moods share tile/prop
 * ids, so a map parses identically against either. Results are cached so
 * repeated calls return stable identities.
 */
export function makeVerdantTileset(time: TimeOfDay): Tileset {
  const cached = CACHE.get(time)
  if (cached) return cached
  const tileset: Tileset = {
    tiles: verdantGround(time),
    props: {
      ...verdantTrees(time),
      ...verdantProps(time),
      ...verdantHouses(time),
    },
  }
  CACHE.set(time, tileset)
  return tileset
}
