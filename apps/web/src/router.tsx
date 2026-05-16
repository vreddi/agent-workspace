import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import type { ReactNode } from 'react'
import { env } from '~/env'
import { useAuthFromWorkOS } from '~/lib/convex-auth'
import { routeTree } from './routeTree.gen'

function ConvexAuthProvider({
  children,
  client,
}: {
  children: ReactNode
  client: ConvexReactClient
}) {
  return (
    <ConvexProviderWithAuth client={client} useAuth={useAuthFromWorkOS}>
      {children}
    </ConvexProviderWithAuth>
  )
}

export function getRouter() {
  const convex = new ConvexReactClient(env.VITE_CONVEX_URL)
  const convexQueryClient = new ConvexQueryClient(convex)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
        gcTime: 5000,
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: { queryClient, convexClient: convex, convexQueryClient },
    Wrap: ({ children }) => (
      <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
    ),
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}
