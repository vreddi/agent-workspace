// People-facing view-model: names, initials, greetings, and the deterministic
// "tone" palette used for avatars/badges.

import { pick } from './format'

export type Tone =
  'sand' | 'sage' | 'clay' | 'fog' | 'rose' | 'slate' | 'graphite'

export const TONE_LIST: ReadonlyArray<Exclude<Tone, 'graphite'>> = [
  'sand',
  'sage',
  'clay',
  'fog',
  'rose',
  'slate',
]

export const TONE_STYLES: Record<Tone, { bg: string; fg: string }> = {
  sand: { bg: 'linear-gradient(135deg,#ffd8b1,#f6a86b)', fg: '#7a3d10' },
  sage: { bg: 'linear-gradient(135deg,#c9eccc,#7cc78a)', fg: '#1f5a2e' },
  clay: { bg: 'linear-gradient(135deg,#ffc8b8,#f08f70)', fg: '#73291a' },
  fog: { bg: 'linear-gradient(135deg,#c5dafd,#7ea2f5)', fg: '#1c3a85' },
  rose: { bg: 'linear-gradient(135deg,#ffcde0,#f48cb5)', fg: '#7a1f47' },
  slate: { bg: 'linear-gradient(135deg,#d6d8ea,#9a9dc7)', fg: '#2e306b' },
  graphite: { bg: 'linear-gradient(135deg,#3a3d4a,#181a22)', fg: '#fafafa' },
}

/** Deterministic non-graphite tone for a stable key (e.g. a user id). */
export function toneFor(key: string): Exclude<Tone, 'graphite'> {
  return pick(TONE_LIST, key)
}

/** Structural shape of a task assignee (a subset of the backend row). */
export interface AssigneeLike {
  userId: string
  name: string | null
  email: string
  imageUrl: string | null
}

export interface DisplayAssignee {
  userId: string
  name: string
  initials: string
  imageUrl: string | null
  tone: Exclude<Tone, 'graphite'>
}

export function toDisplayAssignees(
  assignees: ReadonlyArray<AssigneeLike>,
): DisplayAssignee[] {
  return assignees.map((a) => ({
    userId: a.userId,
    name: a.name && a.name.trim() !== '' ? a.name : a.email,
    initials: initialsFromName(a.name || a.email, '?'),
    imageUrl: a.imageUrl,
    tone: toneFor(a.userId),
  }))
}

/** Up to two initials from a name; `fallback` when empty. */
export function initialsFromName(
  name: string | null | undefined,
  fallback = 'Y',
): string {
  if (!name) return fallback
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return fallback
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/** First whitespace-delimited token of a name, or "there" when absent. */
export function firstName(name: string | null | undefined): string {
  if (!name) return 'there'
  return name.trim().split(/\s+/)[0]!
}

/** Web greeting: 'casual' is always "Hey"; 'time-of-day' buckets by hour. */
export function greetingFor(
  hour: number,
  style: 'casual' | 'time-of-day',
): string {
  if (style === 'casual') return 'Hey'
  if (hour < 5) return 'Still up'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Mobile greeting bucketed by hour. */
export function greetingForHour(hour: number): string {
  if (hour < 5) return 'Up late'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
