import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useEffect } from 'react'

export function useTheme() {
  const currentUser = useQuery(api.users.current)
  const theme = (currentUser?.theme ?? 'system') as 'light' | 'dark' | 'system'

  useEffect(() => {
    const html = document.documentElement

    // Cache the preference so the pre-hydration script in __root.tsx can apply
    // it before first paint on the next load (no light flash). Kept in sync
    // across devices by the server value this hook reads.
    try {
      window.localStorage.setItem('theme', theme)
    } catch {
      /* ignore */
    }

    const apply = (isDark: boolean) => {
      html.classList.toggle('dark', isDark)
      html.style.colorScheme = isDark ? 'dark' : 'light'
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mediaQuery.matches)
      const handleChange = (e: MediaQueryListEvent) => apply(e.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    apply(theme === 'dark')
  }, [theme])

  return theme
}
