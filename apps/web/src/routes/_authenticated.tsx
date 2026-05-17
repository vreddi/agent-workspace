import { auth } from '@clerk/tanstack-react-start/server'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

/**
 * Pathless layout: child routes require a signed-in Clerk session.
 */
const requireAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated) {
    throw redirect({ to: '/' })
  }
  return { userId }
})

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => requireAuth(),
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
