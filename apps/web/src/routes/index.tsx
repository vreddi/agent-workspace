import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Landing } from '~/components/landing/landing'

// The root path is the public landing page; signed-in visitors are sent
// straight to their home (`/app`). Clerk's `auth()` is best-effort here: if
// it fails (misconfig, Clerk API hiccup) we still render the public landing
// rather than 500 the whole page — mirrors `fetchClerkAuth` in `__root.tsx`.
// The `redirect` throw stays outside the try so it isn't swallowed as an error.
const redirectIfSignedIn = createServerFn({ method: 'GET' }).handler(
  async () => {
    let isAuthenticated = false
    try {
      ;({ isAuthenticated } = await auth())
    } catch (err) {
      console.error('[clerk] redirectIfSignedIn auth() failed:', err)
      return
    }
    if (isAuthenticated) {
      throw redirect({ to: '/app' })
    }
  },
)

export const Route = createFileRoute('/')({
  beforeLoad: async () => redirectIfSignedIn(),
  component: Home,
})

function Home() {
  return <Landing />
}
