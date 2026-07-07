/**
 * Loaded font-family names for the app face (Plus Jakarta Sans, same as the
 * web app). Weights mirror the web CSS: 500/600 for UI, 700/800 for
 * headings. The families are registered in the root layout via
 * `useFonts` from @expo-google-fonts/plus-jakarta-sans.
 */
export const Font = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const

export type FontWeight = keyof typeof Font
