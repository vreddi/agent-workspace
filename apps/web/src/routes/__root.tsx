/// <reference types="vite/client" />
import '@org/ui/globals.css'
import type { ConvexQueryClient } from '@convex-dev/react-query'
import type { QueryClient } from '@tanstack/react-query'
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouteContext,
} from '@tanstack/react-router'
import {
  AuthKitProvider,
  getAuthAction,
} from '@workos/authkit-tanstack-react-start/client'
import { ConvexProviderWithAuth, type ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'
import { useAuthFromWorkOS } from '~/lib/convex-auth'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}>()({
  loader: async () => {
    const auth = await getAuthAction()
    return { auth }
  },
  component: RootComponent,
})

function RootComponent() {
  const { auth } = Route.useLoaderData()
  const { convexClient } = useRouteContext({ from: '__root__' })

  return (
    <RootDocument>
      <AuthKitProvider initialAuth={auth}>
        <ConvexProviderWithAuth client={convexClient} useAuth={useAuthFromWorkOS}>
          <Outlet />
        </ConvexProviderWithAuth>
      </AuthKitProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
