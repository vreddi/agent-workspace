import { createFileRoute } from '@tanstack/react-router'
import { signOut } from '~/lib/auth'

export const Route = createFileRoute('/logout')({
  preload: false,
  loader: async () => {
    await signOut()
  },
})
