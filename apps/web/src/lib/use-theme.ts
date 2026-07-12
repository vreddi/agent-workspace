import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useEffect } from 'react'

export function useTheme() {
  const currentUser = useQuery(api.users.current)
  const theme = (currentUser?.theme ?? 'system') as
    | 'light'
    | 'dark'
    | 'system'

  useEffect(() => {
    const html = document.documentElement

    if (theme === 'system') {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (isDark) {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else if (theme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [theme])

  return theme
}
