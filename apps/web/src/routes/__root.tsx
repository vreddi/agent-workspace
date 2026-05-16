/// <reference types="vite/client" />
import '@org/ui/globals.css'
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import {
  AuthKitProvider,
  getAuthAction,
} from '@workos/authkit-tanstack-react-start/client'

export const Route = createRootRoute({
  loader: async () => {
    const auth = await getAuthAction()
    return { auth }
  },
  component: RootComponent,
})

function RootComponent() {
  const { auth } = Route.useLoaderData()

  return (
    <RootDocument>
      <AuthKitProvider initialAuth={auth}>
        <Outlet />
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
