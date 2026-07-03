import {
  DudeMonsterSheet,
  OwletMonsterSheet,
  PinkMonsterSheet,
} from '@worldkit/sprite-actor/examples';
import { COZY_TILESET, parseMap } from '@worldkit/tilemap';
import type { Legend } from '@worldkit/tilemap';
import type { VillageScene } from '#lib/scene';

const LEGEND: Legend = {
  '.': { kind: 'tile', tile: 'grass' },
  ',': { kind: 'tile', tile: 'meadow' },
  '"': { kind: 'tile', tile: 'tall-grass' },
  '*': { kind: 'tile', tile: 'flowers' },
  '#': { kind: 'tile', tile: 'path' },
  '~': { kind: 'tile', tile: 'water' },
  T: { kind: 'prop', prop: 'tree' },
  r: { kind: 'prop', prop: 'rock' },
  s: { kind: 'prop', prop: 'sign' },
  P: { kind: 'prop', prop: 'house-pink' },
  O: { kind: 'prop', prop: 'house-blue' },
  D: { kind: 'prop', prop: 'house-orange' },
  '1': { kind: 'marker', marker: 'home-pink', ground: 'path' },
  '2': { kind: 'marker', marker: 'home-owlet', ground: 'path' },
  '3': { kind: 'marker', marker: 'home-dude', ground: 'path' },
};

// Each house anchor (P/O/D) is the bottom-left of its 3x2 base; the marker
// below its door is where that resident spawns and returns to.
const ROWS = [
  'TTTTTTTTTTTTTTTTTTTT',
  'T..,........*....,.T',
  'T..................T',
  'T..P....O......D...T',
  'T...1....2......3..T',
  'T...#.s..#......#.,T',
  'T..##############..T',
  'T...*....#....r....T',
  'T........#..~~~~~..T',
  'T.""".*..#..~~~~~..T',
  'T."""....#..~~~~~..T',
  'T.""",......*......T',
  'TTTTTTTTTTTTTTTTTTTT',
];

const map = parseMap(ROWS, LEGEND, COZY_TILESET);

/**
 * The showcase scene: three monster agents, each with their own pod, living
 * their little autonomous lives.
 */
export const cozyVillageScene: VillageScene = {
  name: 'cozy-village',
  map,
  tileset: COZY_TILESET,
  residents: [
    {
      id: 'poppy',
      name: 'Poppy',
      sheet: PinkMonsterSheet,
      home: map.markers['home-pink']!,
      lines: [
        "Hi hi! I'm POPPY! I keep every task in tidy little piles...",
        '...then I hop over them! Organizing is basically cardio.',
        'Oh! Your 3 o\'clock reminder? Already filed it. You\'re welcome!',
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
        "Yaaawn... oh, hey. I was gonna file that task. Eventually.",
        "Relax, it's on my list. My list is a rock by the pond.",
        'Poppy says I procrastinate. I prefer "strategic idling".',
      ],
    },
  ],
};
