import {
  useAccessToken,
  useAuth,
} from '@workos/authkit-tanstack-react-start/client'
import { useCallback, useMemo } from 'react'

/** Bridges WorkOS AuthKit session tokens to ConvexProviderWithAuth. */
export function useAuthFromWorkOS() {
  const { loading, user } = useAuth()
  const { getAccessToken, refresh } = useAccessToken()

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) {
        return null
      }
      if (forceRefreshToken) {
        return (await refresh()) ?? null
      }
      return (await getAccessToken()) ?? null
    },
    [user, refresh, getAccessToken],
  )

  return useMemo(
    () => ({
      isLoading: loading,
      isAuthenticated: !!user,
      fetchAccessToken,
    }),
    [loading, user, fetchAccessToken],
  )
}
