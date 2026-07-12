import {
  DudeMonsterSheet,
  OwletMonsterSheet,
  PinkMonsterSheet,
} from '@worldkit/sprite-actor/examples'
import { makeCozyTileset, parseMap } from '@worldkit/tilemap'
import type { Legend, TimeOfDay } from '@worldkit/tilemap'
import type { VillageScene } from '#lib/scene'

const LEGEND: Legend = {
  '.': { kind: 'tile', tile: 'grass' },
  ',': { kind: 'tile', tile: 'meadow' },
  '"': { kind: 'tile', tile: 'tall-grass' },
  '*': { kind: 'tile', tile: 'flowers' },
  f: { kind: 'tile', tile: 'fireflies' },
  '#': { kind: 'tile', tile: 'path' },
  '~': { kind: 'tile', tile: 'water' },
  T: { kind: 'prop', prop: 'tree' },
  Y: { kind: 'prop', prop: 'pine' },
  b: { kind: 'prop', prop: 'bush-autumn' },
  L: { kind: 'prop', prop: 'lantern' },
  r: { kind: 'prop', prop: 'rock' },
  u: { kind: 'prop', prop: 'stump' },
  m: { kind: 'prop', prop: 'mushrooms' },
  s: { kind: 'prop', prop: 'sign' },
  P: { kind: 'prop', prop: 'house-moss' },
  O: { kind: 'prop', prop: 'house-slate' },
  D: { kind: 'prop', prop: 'house-rust' },
  '1': { kind: 'marker', marker: 'home-pink', ground: 'path' },
  '2': { kind: 'marker', marker: 'home-owlet', ground: 'path' },
  '3': { kind: 'marker', marker: 'home-dude', ground: 'path' },
}

// Each house anchor (P/O/D) is the bottom-left of its 3x2 base; the marker
// below its door is where that resident spawns and returns to. Pines along
// the border clip past the frame so the forest reads as continuing beyond,
// and lanterns light the lane between the cabins and the pond.
const ROWS = [
  'TYTTYTTYTTYTYTTYTYTT',
  'TT.,,....,,....,..TT',
  'Y,,..........T....bT',
  'T..P....O......D...T',
  'T...1....2......3..Y',
  'Y,..#.s..#..b...#.,T',
  'T..##############..T',
  'Tb..*..L.#.L..r..u.T',
  'T.,,.T...#...~~~~..Y',
  'T"""..m..#.f~~~~~~.T',
  'Y""",....#..~~~~~f.T',
  'T,"",...*...,..,,..T',
  'TTYTTYTTYTTYTTYTTYTT',
]

// Tile/prop ids are identical across lighting moods, so one parsed map
// serves both scenes.
const map = parseMap(ROWS, LEGEND, makeCozyTileset('night'))

const CACHE = new Map<TimeOfDay, VillageScene>()

/**
 * The showcase scene in the requested lighting mood: three monster agents,
 * each with their own pod, living their little autonomous lives. Scenes
 * are cached so repeated calls return stable identities.
 */
export function makeCozyVillageScene(time: TimeOfDay = 'night'): VillageScene {
  const cached = CACHE.get(time)
  if (cached) return cached
  const scene: VillageScene = {
    name: `cozy-village-${time}`,
    map,
    tileset: makeCozyTileset(time),
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
      "Hi hi! I'm POPPY! I keep every task in tidy little piles...",
      '...then I hop over them! Organizing is basically cardio.',
      "Oh! Your 3 o'clock reminder? Already filed it. You're welcome!",
    ],
  },
  {
    id: 'hoot',
    name: 'Hoot',
    sheet: OwletMonsterSheet,
    home: map.markers['home-owlet']!,
    lines: [
      'Hoo... a well-planned day starts the night before, you know.',
      'I reviewed your calendar while you slept. Strictly professional.',
      'Deadlines are just birds that have not landed yet. I watch them.',
    ],
  },
  {
    id: 'rusty',
    name: 'Rusty',
    sheet: DudeMonsterSheet,
    home: map.markers['home-dude']!,
    lines: [
      'Yaaawn... oh, hey. I was gonna file that task. Eventually.',
      "Relax, it's on my list. My list is a rock by the pond.",
      'Poppy says I procrastinate. I prefer "strategic idling".',
    ],
  },
]
