import {
  DudeMonsterSheet,
  OwletMonsterSheet,
  PinkMonsterSheet,
} from '@worldkit/sprite-actor/examples'
import { makeVerdantTileset, parseMap } from '@worldkit/tilemap'
import type { Legend, TimeOfDay } from '@worldkit/tilemap'
import type { VillageScene } from '#lib/scene'

const LEGEND: Legend = {
  '.': { kind: 'tile', tile: 'grass' },
  ',': { kind: 'tile', tile: 'meadow' },
  '"': { kind: 'tile', tile: 'tall-grass' },
  '*': { kind: 'tile', tile: 'flowers' },
  f: { kind: 'tile', tile: 'fireflies' },
  '#': { kind: 'tile', tile: 'path' },
  c: { kind: 'tile', tile: 'cobble' },
  '~': { kind: 'tile', tile: 'water' },
  T: { kind: 'prop', prop: 'oak' },
  Y: { kind: 'prop', prop: 'pine' },
  b: { kind: 'prop', prop: 'bush' },
  r: { kind: 'prop', prop: 'rock' },
  u: { kind: 'prop', prop: 'stump' },
  m: { kind: 'prop', prop: 'mushrooms' },
  s: { kind: 'prop', prop: 'sign' },
  L: { kind: 'prop', prop: 'lamp-post' },
  W: { kind: 'prop', prop: 'well', ground: 'cobble' },
  K: { kind: 'prop', prop: 'market-stall' },
  P: { kind: 'prop', prop: 'house-thatch' },
  O: { kind: 'prop', prop: 'house-slate' },
  D: { kind: 'prop', prop: 'house-plum' },
  '1': { kind: 'marker', marker: 'home-pink', ground: 'path' },
  '2': { kind: 'marker', marker: 'home-owlet', ground: 'path' },
  '3': { kind: 'marker', marker: 'home-dude', ground: 'path' },
}

// A 20x13 clearing. The top border trees all anchor on row 2 so their canopies
// (which draw two rows up from the anchor) stay on-screen instead of clipping
// off the top edge — oaks (2 wide) and pines (1 wide) interleave to block every
// column 0..19 at row 2, forming an unbroken forest wall. Rows 0-1 are plain
// grass, hidden behind those canopies and walled off below.
//
// Three cottages line the upper terrace (thatch / slate / plum, left to center
// to right); each house anchor (P/O/D) is the bottom-left of its 3x2 base, and
// the numbered marker below its door is where that resident spawns and drifts
// home to. A dirt lane runs the width of the borough, lit by lamp-posts that
// kindle at dusk; below it a cobbled plaza wraps the well, with the market
// stall to its left, and the pond pools into the lower-right corner with
// fireflies drifting off the reeds. Pines wall the left/right edges and oaks +
// pines wall the bottom so the forest reads as continuing past the frame.
const ROWS = [
  '....................',
  '....................',
  'T.YT.YT.YT.YT.YT.YT.',
  'Y.,....,......,....Y',
  'Y.P...Y.O...Y.D....Y',
  'Y..1.....2.....3...Y',
  'Y.L#############L..Y',
  'Y.s......#...b.....Y',
  'Y....r.ccccc.u.....Y',
  'Y......ccWccf~~~~~~Y',
  'Y..K...cccccL~~~~~~Y',
  'Y.""*....m..ff~~~~.Y',
  'T.YT.YT.YT.YT.~~~~T.',
]

// Tile/prop ids are identical across lighting moods, so one parsed map serves
// both scenes.
const map = parseMap(ROWS, LEGEND, makeVerdantTileset('night'))

const CACHE = new Map<TimeOfDay, VillageScene>()

/**
 * The Borough — the agents' home world, where they come back to relax and
 * spend time with each other, in the requested lighting mood: three monster
 * agents, each with their own cottage. (Work hours will eventually move them
 * to a separate office map; that world doesn't exist yet.) Scenes are cached
 * so repeated calls return stable identities.
 */
export function makeBoroughScene(
  time: TimeOfDay = 'night',
): VillageScene {
  const cached = CACHE.get(time)
  if (cached) return cached
  const scene: VillageScene = {
    name: `the-borough-${time}`,
    map,
    tileset: makeVerdantTileset(time),
    residents: RESIDENTS,
  }
  CACHE.set(time, scene)
  return scene
}

const RESIDENTS: VillageScene['residents'] = [
  {
    id: 'poppy',
    name: 'Poppy',
    sheet: PinkMonsterSheet,
    home: map.markers['home-pink']!,
    lines: [
      "Hi hi! I'm POPPY! I sort your day into neat little rows...",
      '...then I skip down them, one task at a time. Tidy is fun!',
      'That reminder you forgot? Tucked it by the well. Come see!',
    ],
  },
  {
    id: 'hoot',
    name: 'Hoot',
    sheet: OwletMonsterSheet,
    home: map.markers['home-owlet']!,
    lines: [
      'Hoo... I light the lamps before dusk so nothing gets lost.',
      'I read ahead in your calendar. A good night plans the morning.',
      'Deadlines are just birds mid-flight. I keep an eye on them.',
    ],
  },
  {
    id: 'rusty',
    name: 'Rusty',
    sheet: DudeMonsterSheet,
    home: map.markers['home-dude']!,
    lines: [
      'Yaaawn... oh, hey. That task? Filing it right after this nap.',
      'My to-do list is a warm rock by the pond. Very reliable.',
      'Poppy calls it procrastinating. I call it letting ideas steep.',
    ],
  },
]
