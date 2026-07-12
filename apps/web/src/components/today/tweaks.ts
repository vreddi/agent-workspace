export type Theme = 'light' | 'dark'
export type Greeting = 'casual' | 'time-of-day'

export type Tweaks = {
  theme: Theme
  accent: string
  greeting: Greeting
  showAI: boolean
}

export const ACCENT_OPTIONS = [
  '#2b6ef5',
  '#7b5cf6',
  '#16a34a',
  '#e25151',
  '#0a0a0a',
]
export const TWEAKS_STORAGE_KEY = 'today.tweaks.v1'

export function loadTweaks(): Tweaks {
  if (typeof window === 'undefined')
    return {
      theme: 'light',
      accent: ACCENT_OPTIONS[0]!,
      greeting: 'time-of-day',
      showAI: true,
    }
  try {
    const raw = window.localStorage.getItem(TWEAKS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Tweaks>
      return {
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        accent:
          typeof parsed.accent === 'string'
            ? parsed.accent
            : ACCENT_OPTIONS[0]!,
        greeting: parsed.greeting === 'casual' ? 'casual' : 'time-of-day',
        showAI: parsed.showAI !== false,
      }
    }
  } catch {
    /* ignore */
  }
  return {
    theme: 'light',
    accent: ACCENT_OPTIONS[0]!,
    greeting: 'time-of-day',
    showAI: true,
  }
}
