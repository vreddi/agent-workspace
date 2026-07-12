export const MOVEMENT_ACTIONS = [
  'idle',
  'walk',
  'run',
  'sprint',
  'crawl',
  'crouch',
  'sneak',
  'jump',
  'double-jump',
  'fall',
  'land',
  'slide',
  'dash',
  'roll',
  'climb',
  'climb-up',
  'climb-down',
  'swim',
  'dive',
  'surface',
  'fly',
  'hover',
  'glide',
  'teleport-in',
  'teleport-out',
  'sit-down',
  'stand-up',
  'sit',
  'sleep',
  'wake',
] as const

export const COMBAT_ACTIONS = [
  'attack1',
  'attack2',
  'attack3',
  'heavy-attack',
  'walk-attack',
  'charge',
  'block',
  'parry',
  'dodge',
  'shoot',
  'throw',
  'kick',
  'punch',
  'cast',
  'channel',
  'summon',
  'heal',
] as const

export const STATE_ACTIONS = [
  'hurt',
  'stun',
  'dizzy',
  'knockdown',
  'death',
  'revive',
  'victory',
  'defeat',
] as const

export const EMOTE_ACTIONS = [
  'wave',
  'bow',
  'salute',
  'point',
  'nod',
  'shake-head',
  'shrug',
  'dance',
  'cheer',
  'clap',
  'laugh',
  'cry',
  'yawn',
  'sneeze',
  'kiss',
  'hug',
] as const

export const INTERACT_ACTIONS = [
  'push',
  'pull',
  'lift',
  'carry',
  'drop',
  'pickup',
  'place',
  'use',
  'open',
  'close',
  'knock',
  'read',
  'write',
  'eat',
  'drink',
  'talk',
  'listen',
] as const

export const JOB_ACTIONS = [
  'fish',
  'mine',
  'chop',
  'dig',
  'water',
  'plant',
  'harvest',
  'build',
  'smith',
  'cook',
  'sew',
  'paint',
] as const

export const ALL_ACTIONS = [
  ...MOVEMENT_ACTIONS,
  ...COMBAT_ACTIONS,
  ...STATE_ACTIONS,
  ...EMOTE_ACTIONS,
  ...INTERACT_ACTIONS,
  ...JOB_ACTIONS,
] as const

export type MovementAction = (typeof MOVEMENT_ACTIONS)[number]
export type CombatAction = (typeof COMBAT_ACTIONS)[number]
export type StateAction = (typeof STATE_ACTIONS)[number]
export type EmoteAction = (typeof EMOTE_ACTIONS)[number]
export type InteractAction = (typeof INTERACT_ACTIONS)[number]
export type JobAction = (typeof JOB_ACTIONS)[number]

export type ActionName =
  | MovementAction
  | CombatAction
  | StateAction
  | EmoteAction
  | InteractAction
  | JobAction

export type ActionCategory =
  | 'movement'
  | 'combat'
  | 'state'
  | 'emote'
  | 'interact'
  | 'job'

export const ACTION_CATEGORY: Record<ActionName, ActionCategory> = (() => {
  const m: Partial<Record<ActionName, ActionCategory>> = {}
  for (const a of MOVEMENT_ACTIONS) m[a] = 'movement'
  for (const a of COMBAT_ACTIONS) m[a] = 'combat'
  for (const a of STATE_ACTIONS) m[a] = 'state'
  for (const a of EMOTE_ACTIONS) m[a] = 'emote'
  for (const a of INTERACT_ACTIONS) m[a] = 'interact'
  for (const a of JOB_ACTIONS) m[a] = 'job'
  return m as Record<ActionName, ActionCategory>
})()

const ONE_SHOT_SET = new Set<ActionName>([
  'jump',
  'double-jump',
  'fall',
  'land',
  'slide',
  'dash',
  'roll',
  'sit-down',
  'stand-up',
  'wake',
  'teleport-in',
  'teleport-out',
  'attack1',
  'attack2',
  'attack3',
  'heavy-attack',
  'shoot',
  'throw',
  'kick',
  'punch',
  'cast',
  'summon',
  'heal',
  'block',
  'parry',
  'dodge',
  'hurt',
  'knockdown',
  'death',
  'revive',
  'victory',
  'defeat',
  'wave',
  'bow',
  'salute',
  'point',
  'nod',
  'shake-head',
  'shrug',
  'cheer',
  'clap',
  'yawn',
  'sneeze',
  'kiss',
  'hug',
  'pickup',
  'drop',
  'place',
  'use',
  'open',
  'close',
  'knock',
  'eat',
  'drink',
])

export function isOneShotAction(action: ActionName): boolean {
  return ONE_SHOT_SET.has(action)
}
