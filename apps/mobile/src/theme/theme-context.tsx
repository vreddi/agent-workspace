import { palettes, type Palette, type SchemeName } from '@org/theme'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useColorScheme } from 'react-native'
import { getLocalPreference, setLocalPreference } from '@/lib/preferences'

export type ThemePreference = 'system' | SchemeName

interface ThemeValue {
  /** Resolved scheme after applying the preference. */
  scheme: SchemeName
  /** The @org/theme palette for the resolved scheme. */
  palette: Palette
  preference: ThemePreference
  /** Persists to device storage and updates the resolved scheme. */
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

/** AsyncStorage key for the persisted theme preference. */
const THEME_PREFERENCE_KEY = 'theme'

const VALID_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark']

function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && VALID_PREFERENCES.includes(value as ThemePreference)
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  // Gate rendering until the stored preference loads so we never flash the
  // wrong theme on cold start. The read is a single AsyncStorage hit.
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    void getLocalPreference<ThemePreference>(THEME_PREFERENCE_KEY, 'system').then((stored) => {
      if (!active) return
      if (isThemePreference(stored)) setPreferenceState(stored)
      setHydrated(true)
    })
    return () => {
      active = false
    }
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    void setLocalPreference(THEME_PREFERENCE_KEY, next)
  }, [])

  const scheme: SchemeName =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference
  const value = useMemo(
    () => ({ scheme, palette: palettes[scheme], preference, setPreference }),
    [scheme, preference, setPreference],
  )

  if (!hydrated) return null
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside AppThemeProvider')
  return value
}
