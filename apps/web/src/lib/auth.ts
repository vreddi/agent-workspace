/**
 * Web auth boundary for @org/web.
 *
 * Re-exports WorkOS AuthKit server helpers so route loaders import from one place.
 * Mobile/desktop/watch apps would use platform WorkOS SDKs later; shared user/session
 * types can move to a future `@org/auth` package when multiple clients exist.
 */
export {
  getAuth,
  getSignInUrl,
  getSignUpUrl,
  signOut,
  switchToOrganization,
} from '@workos/authkit-tanstack-react-start'
