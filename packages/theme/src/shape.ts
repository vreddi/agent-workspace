/**
 * Corner radii and spacing steps, matching the web chrome (chips 7–9,
 * buttons/rows 10, panels 12–16, cards 18).
 */
export const radius = {
  xs: 7,
  sm: 9,
  md: 10,
  lg: 12,
  xl: 16,
  card: 18,
  pill: 999,
} as const

/** 4px-based spacing scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const
