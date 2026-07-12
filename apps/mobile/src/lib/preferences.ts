/**
 * Tiny typed local-preferences store over AsyncStorage. This is for small,
 * device-local UI settings (theme, toggles) — NOT for user data, which lives
 * in Convex, or for secrets, which belong in expo-secure-store.
 *
 * Values are JSON-serialized, so any serializable `T` works. Reads and writes
 * fail soft: a missing/corrupt entry or a storage error resolves to the
 * caller's fallback rather than throwing.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'

/** Namespacing keeps app preferences from colliding with library keys. */
const PREFIX = 'pref:'

/** Read a stored preference, resolving to `fallback` if unset or unreadable. */
export async function getLocalPreference<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Persist a preference. Errors are swallowed — persistence is best-effort. */
export async function setLocalPreference<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Best-effort: ignore write failures (e.g. storage full).
  }
}

/**
 * React binding for a single preference. Starts at `fallback`, hydrates from
 * storage on mount, and writes through on every update.
 *
 * The third tuple element, `hydrated`, is true once the stored value has
 * loaded — useful when the initial value must not flash the fallback.
 */
export function useLocalPreference<T>(
  key: string,
  fallback: T,
): readonly [T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(fallback)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true
    void getLocalPreference(key, fallback).then((stored) => {
      if (!active) return
      setValue(stored)
      setHydrated(true)
    })
    return () => {
      active = false
    }
    // `fallback` is intentionally read once on mount; changing it later
    // should not re-trigger hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const set = useCallback(
    (next: T) => {
      setValue(next)
      void setLocalPreference(key, next)
    },
    [key],
  )

  return [value, set, hydrated] as const
}
