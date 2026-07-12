import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Landing } from '~/components/landing/landing'

// The root path is the public landing page; signed-in visitors are sent
// straight to their home (`/app`).
const redirectIfSignedIn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { isAuthenticated } = await auth()
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
