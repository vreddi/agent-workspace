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
import { useTheme } from '~/lib/use-theme'
import { darkTokensCss } from '~/lib/theme-css'

// Runs before first paint (inline in <head>) so a saved dark preference is
// applied to <html> before the body renders — no light flash on reload. It
// reads the theme cached in localStorage by useTheme; falls back to the OS
// setting on a first-ever visit. useTheme reconciles with the server value
// once Convex loads.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.style.colorScheme=d?'dark':'light';}catch(e){}})();`
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
        <ThemeProvider>
          {/* suppressHydrationWarning: the pre-hydration script sets the theme
              class / color-scheme on <html> before React hydrates. */}
          <html lang="en" suppressHydrationWarning>
            <head>
              {/* Shared dark-mode tokens (@org/theme), injected once so the
                  whole document — including portaled menus outside .today-root
                  — reads the same GitHub-dark scale as the mobile app. */}
              <style>{darkTokensCss}</style>
              {/* Applies the theme before first paint to avoid a light flash. */}
              <script>{themeInitScript}</script>
              <HeadContent />
            </head>
            <body>
              <Outlet />
              <Scripts />
            </body>
          </html>
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme()
  return children
}
