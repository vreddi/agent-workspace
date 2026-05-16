import { createStart } from '@tanstack/react-start'
import { authkitMiddleware } from '@workos/authkit-tanstack-react-start'

/**
 * TanStack Start instance with WorkOS AuthKit middleware on every request.
 * @see apps/web/README.md — WorkOS dashboard and env setup
 */
export const startInstance = createStart(() => ({
  requestMiddleware: [authkitMiddleware()],
}))
