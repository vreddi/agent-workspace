import { Button } from '@org/ui/components/button'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useAuth } from '@workos/authkit-tanstack-react-start/client'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { user, loading } = useAuth()

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">TODO</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to manage your todos with real-time sync.
        </p>
      </div>

      {user ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm">
            Signed in as{' '}
            <span className="font-medium">{user.email ?? user.id}</span>
          </p>
          <Button asChild>
            <Link to="/todos">Open todos</Link>
          </Button>
          <Button variant="ghost" asChild className="h-auto px-0">
            <Link to="/logout">Sign out</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Checking session…</p>
          ) : null}
          <Button asChild>
            <a href="/api/auth/sign-in">Sign in</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/auth/sign-up">Create account</a>
          </Button>
        </div>
      )}
    </main>
  )
}
