/**
 * Dummy model catalog. Nothing here is wired to a real provider — no API
 * keys, no subscriptions. The selected id is stored on the agent so real
 * model auth can plug in later without a data migration.
 */
export type ModelOption = {
  id: string
  label: string
  provider: 'Anthropic' | 'OpenAI' | 'Google'
  blurb: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'claude-fable-5',
    label: 'Claude Fable 5',
    provider: 'Anthropic',
    blurb: 'Deepest reasoning, slowest walker',
  },
  {
    id: 'claude-opus-4-8',
    label: 'Claude Opus 4.8',
    provider: 'Anthropic',
    blurb: 'Heavyweight thinker',
  },
  {
    id: 'claude-sonnet-5',
    label: 'Claude Sonnet 5',
    provider: 'Anthropic',
    blurb: 'Balanced speed and smarts',
  },
  {
    id: 'claude-haiku-4-5',
    label: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    blurb: 'Quick errands, light footprint',
  },
  {
    id: 'gpt-5',
    label: 'GPT-5',
    provider: 'OpenAI',
    blurb: 'General-purpose all-rounder',
  },
  {
    id: 'gemini-2-5-pro',
    label: 'Gemini 2.5 Pro',
    provider: 'Google',
    blurb: 'Long-context researcher',
  },
]

export const DEFAULT_MODEL_ID = 'claude-sonnet-5'

export function modelById(id: string): ModelOption | null {
  return MODEL_OPTIONS.find((m) => m.id === id) ?? null
}

export const MODEL_PROVIDERS = ['Anthropic', 'OpenAI', 'Google'] as const
