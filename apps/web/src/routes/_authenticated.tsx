import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getAuth } from '~/lib/auth'

/**
 * Pathless layout: all child routes require a signed-in WorkOS session.
 * Add future TODO routes under `src/routes/_authenticated/`.
 */
export const Route = createFileRoute('/_authenticated')({
  loader: async ({ location }) => {
    const { user } = await getAuth()
    if (!user) {
      throw redirect({
        to: '/api/auth/sign-in',
        search: { returnPathname: location.pathname },
      })
    }
    return { user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
