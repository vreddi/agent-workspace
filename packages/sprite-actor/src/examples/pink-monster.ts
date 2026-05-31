import type { SpriteSheet } from '../lib/sprite-sheet';

import portrait from '../assets/pink-monster/portrait.png';
import idle from '../assets/pink-monster/idle.png';
import walk from '../assets/pink-monster/walk.png';
import run from '../assets/pink-monster/run.png';
import jump from '../assets/pink-monster/jump.png';
import climb from '../assets/pink-monster/climb.png';
import push from '../assets/pink-monster/push.png';
import attack1 from '../assets/pink-monster/attack1.png';
import attack2 from '../assets/pink-monster/attack2.png';
import throwSrc from '../assets/pink-monster/throw.png';
import hurt from '../assets/pink-monster/hurt.png';
import death from '../assets/pink-monster/death.png';
import walkAttack from '../assets/pink-monster/walk-attack.png';

export const PinkMonsterSheet: SpriteSheet = {
  name: 'Pink Monster',
  frameWidth: 32,
  frameHeight: 32,
  fps: 8,
  portrait,
  actions: {
    idle: { src: idle, frames: 4 },
    walk: { src: walk, frames: 6 },
    run: { src: run, frames: 6, fps: 12 },
    jump: { src: jump, frames: 8 },
    climb: { src: climb, frames: 4 },
    push: { src: push, frames: 6 },
    attack1: { src: attack1, frames: 4, fps: 12 },
    attack2: { src: attack2, frames: 6, fps: 12 },
    throw: { src: throwSrc, frames: 4, fps: 12 },
    hurt: { src: hurt, frames: 4 },
    death: { src: death, frames: 8 },
    'walk-attack': { src: walkAttack, frames: 6 },
  },
};
