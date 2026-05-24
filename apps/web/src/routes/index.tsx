import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
} from '@clerk/tanstack-react-start'
import { Button } from '@org/ui/components/button'
import { createFileRoute } from '@tanstack/react-router'
import { Authenticated } from 'convex/react'
import { TodayDashboard } from '../components/today/dashboard'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { isLoaded } = useUser()
  const missingPublishableKey = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  return (
    <>
      <SignedOut>
        <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
          <p className="text-sm text-muted-foreground">
            A personal task manager with an AI co-pilot. Sign in to see your day.
          </p>
          {missingPublishableKey ? (
            <p className="text-sm text-destructive">
              Missing <code className="text-xs">VITE_CLERK_PUBLISHABLE_KEY</code> in{' '}
              <code className="text-xs">apps/web/.env.local</code>. Restart{' '}
              <code className="text-xs">pnpm dev:web</code> after adding it.
            </p>
          ) : null}
          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Checking session…</p>
          ) : null}
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <Button type="button" disabled={missingPublishableKey}>
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button
                type="button"
                variant="outline"
                disabled={missingPublishableKey}
              >
                Create account
              </Button>
            </SignUpButton>
          </div>
        </main>
      </SignedOut>

      <SignedIn>
        <Authenticated>
          <TodayDashboard />
        </Authenticated>
      </SignedIn>
    </>
  )
}
