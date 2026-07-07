/**
 * Type scale shared across apps. Sizes are unitless numbers: px on web,
 * points in React Native (both render 1:1 at standard density).
 *
 * The app face is Plus Jakarta Sans; `fontFamily` is the family name only —
 * each platform loads it its own way (web via CSS, mobile via expo-font).
 */
export const fontFamily = 'Plus Jakarta Sans'
export const monoFontFamily = 'DM Mono'

export const fontSize = {
  /** Overline labels, kbd hints. */
  xs: 11,
  /** Metadata, counts, chips. */
  sm: 12.5,
  /** Nav links, buttons, secondary rows. */
  md: 13.5,
  /** Body / task titles. */
  base: 15,
  /** Section headings. */
  lg: 18,
  /** Screen titles (mobile), card headlines. */
  xl: 24,
  /** Page headings. */
  xxl: 30,
  /** Hero greeting. */
  hero: 33,
} as const

/**
 * Letter-spacing in em, matching the web CSS. React Native wants absolute
 * units — use `tracking(size, em)` to convert.
 */
export const letterSpacingEm = {
  tight: -0.01,
  tighter: -0.02,
  tightest: -0.03,
  wide: 0.04,
  wider: 0.08,
} as const

/** Convert an em-based tracking value to the absolute units RN expects. */
export function tracking(
  size: number,
  em: (typeof letterSpacingEm)[keyof typeof letterSpacingEm],
): number {
  return size * em
}
