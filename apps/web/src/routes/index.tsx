import { Button } from '@org/ui/components/button'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
} from '@clerk/tanstack-react-start'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { user, isLoaded } = useUser()

  const missingPublishableKey = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">TODO</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage your todos with real-time sync.
        </p>
      </div>

      <SignedOut>
        <div className="flex flex-col items-start gap-3">
          {missingPublishableKey ? (
            <p className="text-sm text-destructive">
              Missing <code className="text-xs">VITE_CLERK_PUBLISHABLE_KEY</code>{' '}
              in <code className="text-xs">apps/web/.env.local</code>. Restart{' '}
              <code className="text-xs">pnpm dev:web</code> after adding it.
            </p>
          ) : null}
          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Checking session…</p>
          ) : null}
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
      </SignedOut>

      <SignedIn>
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">
            Signed in as{' '}
            <span className="font-medium">
              {user?.primaryEmailAddress?.emailAddress ?? user?.id}
            </span>
          </p>
          <Button asChild>
            <Link to="/todos">Open todos</Link>
          </Button>
        </div>
      </SignedIn>
    </main>
  )
}
