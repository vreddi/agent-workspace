/**
 * Public runtime configuration, validated at startup (the mobile analog of
 * apps/web/src/env.ts).
 *
 * SECURITY MODEL: a React Native bundle ships to the user's device, so
 * every value here is public by definition. Expo only inlines variables
 * prefixed EXPO_PUBLIC_ — the `process.env.EXPO_PUBLIC_*` expressions below
 * must stay written out literally for Metro to substitute them at build
 * time. Secrets (sk_*, whsec_*, deploy keys) must never be added to this
 * file or to apps/mobile/.env.local; they belong to the web/Convex side.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.local.example to .env.local (or link ` +
        `mobile.env.local via scripts/link-worktree-env.sh) and restart ` +
        `with \`expo start --clear\` — EXPO_PUBLIC_ values are inlined at ` +
        `bundle time.`,
    )
  }
  return value
}

const convexUrl = required('EXPO_PUBLIC_CONVEX_URL', process.env.EXPO_PUBLIC_CONVEX_URL)
if (!convexUrl.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_CONVEX_URL must be an https:// deployment URL')
}

const clerkPublishableKey = required(
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
)
// Refuse to boot with a secret key: publishable keys (pk_*) are the only
// Clerk credential allowed inside a shipped app bundle.
if (!clerkPublishableKey.startsWith('pk_')) {
  throw new Error(
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY must be a publishable key (pk_...). ' +
      'Never put a Clerk secret key in the mobile app.',
  )
}

export const env = { convexUrl, clerkPublishableKey }
