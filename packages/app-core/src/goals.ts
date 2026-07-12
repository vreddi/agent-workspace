// Goal-type encoding and the goal-type color palette. Pure data + parsing;
// the Tailwind class mapping and React components stay in the web app.

/** Fields needed to encode a goal's type as a select value. */
export interface GoalTypeInput {
  typeSlug: string | null
  customTypeId: string | null
}

// Encodes a goal's type as a select value:
// '' = none, 'sys:<slug>' for built-ins, 'custom:<id>' for custom types.
export function goalTypeValue(goal: GoalTypeInput): string {
  if (goal.typeSlug !== null) return `sys:${goal.typeSlug}`
  if (goal.customTypeId !== null) return `custom:${goal.customTypeId}`
  return ''
}

export type TypeSelection<TId extends string = string> =
  | { kind: 'none' }
  | { kind: 'system'; slug: string }
  | { kind: 'custom'; id: TId }

/** Inverse of {@link goalTypeValue}. `TId` lets callers recover a branded id. */
export function parseTypeValue<TId extends string = string>(
  value: string,
): TypeSelection<TId> {
  if (value.startsWith('sys:')) return { kind: 'system', slug: value.slice(4) }
  if (value.startsWith('custom:')) {
    return { kind: 'custom', id: value.slice(7) as TId }
  }
  return { kind: 'none' }
}

// Color tokens used by goal types (system types use exactly these; custom
// types are created from the same palette).
export const GOAL_TYPE_COLOR_TOKENS = [
  'emerald',
  'orange',
  'indigo',
  'sky',
  'rose',
  'amber',
  'violet',
  'slate',
] as const
export type GoalTypeColorToken = (typeof GOAL_TYPE_COLOR_TOKENS)[number]
