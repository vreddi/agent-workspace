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
import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import {
  ConvexProviderWithClerk,
  type ConvexReactClient,
} from 'convex/react-clerk'
const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { userId, getToken } = await auth()
    const token = await getToken({ template: 'convex' })
    return { userId, token }
  } catch (err) {
    console.error('[clerk] fetchClerkAuth failed:', err)
    return { userId: null, token: null }
  }
})

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexClient: ConvexReactClient
  convexQueryClient: ConvexQueryClient
}>()({
  beforeLoad: async (ctx) => {
    const { userId, token } = await fetchClerkAuth()
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token)
    }
    return { userId, token }
  },
  component: RootComponent,
  notFoundComponent: () => (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-2 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
    </main>
  ),
})

function RootComponent() {
  const { convexClient } = useRouteContext({ from: '__root__' })

  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
        <html lang="en">
          <head>
            <HeadContent />
          </head>
          <body>
            <Outlet />
            <Scripts />
          </body>
        </html>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
