/**
 * App color palettes, one per scheme — the single cross-platform source of
 * truth for the app surfaces. Mobile reads these directly; the web app builds
 * its `--t-*` CSS custom properties from them
 * (`apps/web/src/components/today/styles.ts` interpolates these values), so
 * the two platforms can no longer drift.
 *
 * Values are plain hex (oklch/color-mix pre-resolved) so they work everywhere,
 * including React Native which cannot parse oklch or color-mix(). Light is a
 * warm near-neutral "soft white"; dark is GitHub's "dark default" palette
 * (see `githubDark` below).
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

/**
 * GitHub's "dark default" primer scale — the raw source for every dark-mode
 * value. The `dark` palette (app surfaces) is built from this, and the web
 * app maps these onto its `--gh-*` / shadcn dark tokens, so a single edit
 * here retints dark mode across web and mobile.
 */
export const githubDark = {
  canvas: '#0d1117', // page background   (canvas.default)
  canvasInset: '#010409', // deepest wells     (canvas.inset)
  surface: '#161b22', // cards / raised    (canvas.subtle)
  surface2: '#21262d', // hover / secondary (neutral.muted)
  border: '#30363d', // borders           (border.default)
  borderMuted: '#21262d', // faint dividers    (border.muted)
  fg: '#e6edf3', // primary text      (fg.default)
  fgMuted: '#8b949e', // secondary text    (fg.muted)
  fgSubtle: '#6e7681', // tertiary text     (fg.subtle)
  fgFaint: '#484f58', // disabled / hair   (neutral.emphasis)
  accent: '#2f81f7', // links / accent    (accent.fg)
  accentEmphasis: '#1f6feb', // accent buttons    (accent.emphasis)
  success: '#3fb950', // success           (success.fg)
  attention: '#d29922', // warning           (attention.fg)
  danger: '#f85149', // danger            (danger.fg)
  purple: '#a371f7', // charts            (done.fg)
} as const

export const dark: Palette = {
  bg: githubDark.canvas,
  surface: githubDark.surface,
  rail: githubDark.canvas,
  ink1: githubDark.fg,
  ink2: githubDark.fgMuted,
  ink3: githubDark.fgSubtle,
  ink4: githubDark.fgFaint,
  divider: githubDark.border,
  chipBg: githubDark.surface2,
  hover: githubDark.surface2,
  accent: githubDark.accent,
  // accent 22% over surface / accent 60% over white — pre-resolved for RN.
  accentSoft: '#1c3151',
  accentInk: '#82b3fa',
  overdue: githubDark.danger,
  overdueSoft: '#2d1416',
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
