import { palettes, type Palette, type SchemeName } from '@org/theme'
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'

export type ThemePreference = 'system' | SchemeName

interface ThemeValue {
  /** Resolved scheme after applying the preference. */
  scheme: SchemeName
  /** The @org/theme palette for the resolved scheme. */
  palette: Palette
  preference: ThemePreference
  /** In-memory for now; persistence lands with real settings storage. */
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [preference, setPreference] = useState<ThemePreference>('system')
  const scheme: SchemeName =
    preference === 'system'
      ? system === 'dark'
        ? 'dark'
        : 'light'
      : preference
  const value = useMemo(
    () => ({ scheme, palette: palettes[scheme], preference, setPreference }),
    [scheme, preference],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside AppThemeProvider')
  return value
}
