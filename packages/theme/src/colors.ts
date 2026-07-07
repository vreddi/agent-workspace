/**
 * App color palettes, one per scheme. These are the canonical "soft white"
 * theme values from the web app's logged-in surfaces
 * (`apps/web/src/components/today/styles.ts`), with oklch/color-mix values
 * pre-resolved to hex so they work everywhere — including React Native,
 * which cannot parse oklch or color-mix().
 *
 * Light is warm near-neutral (no blue cast); dark is a cool slate. Keep the
 * two files in sync when the theme evolves.
 */
export interface Palette {
  /** Page background. */
  bg: string
  /** Cards, sheets, elevated surfaces. */
  surface: string
  /** Side rails / secondary surfaces. */
  rail: string
  /** Primary text. */
  ink1: string
  /** Secondary text. */
  ink2: string
  /** Tertiary text: metadata, counts, placeholders. */
  ink3: string
  /** Faintest ink: disabled, hairline glyphs, empty dots. */
  ink4: string
  /** Hairline borders between rows/sections. */
  divider: string
  /** Chip / inset surface. */
  chipBg: string
  /** Hover / pressed surface. */
  hover: string
  /** Brand accent (buttons, links, active states). */
  accent: string
  /** Accent at ~14% over surface: soft fills behind accent content. */
  accentSoft: string
  /** Accent legible on accentSoft. */
  accentInk: string
  /** Overdue / destructive. */
  overdue: string
  /** Soft fill behind overdue content. */
  overdueSoft: string
}

export const light: Palette = {
  bg: '#fbfaf9',
  surface: '#fffefe',
  rail: '#fffefe',
  ink1: '#211f1c',
  ink2: '#65635e',
  ink3: '#918f8a',
  ink4: '#cdccc8',
  divider: '#ebeae8',
  chipBg: '#f3f2f0',
  hover: '#f7f6f4',
  accent: '#2b6ef5',
  accentSoft: '#e1eafd',
  accentInk: '#2258c4',
  overdue: '#e25151',
  overdueSoft: '#fde8e8',
}

export const dark: Palette = {
  bg: '#0d0f15',
  surface: '#15181f',
  rail: '#11141a',
  ink1: '#f1f3f8',
  ink2: '#9aa1b2',
  ink3: '#6b7185',
  ink4: '#3a3f4e',
  divider: '#1f242e',
  chipBg: '#1c2029',
  hover: '#1a1e26',
  accent: '#5b8df8',
  accentSoft: '#24324f',
  accentInk: '#9dbbfb',
  overdue: '#f37777',
  overdueSoft: '#2d1a1a',
}

export const palettes = { light, dark } as const
export type SchemeName = keyof typeof palettes

/** Task priority dots — same hues in both schemes. */
export const priority = {
  high: '#e25151',
  medium: '#e8a13c',
  low: '#5b8df8',
} as const
export type PriorityName = keyof typeof priority

/** Brand avatar / agent gradient (green, used for user + agent marks). */
export const brandGradient = ['#18a86b', '#0e7a4d'] as const
