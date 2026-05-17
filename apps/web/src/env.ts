import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * Resolve a `VITE_*` value from whichever source is populated for the
 * current evaluation context: `import.meta.env` in the browser bundle,
 * `process.env` in Node/SSR (Vite injects loaded `.env.local` here).
 */
function viteClient(name: 'VITE_CLERK_PUBLISHABLE_KEY' | 'VITE_CONVEX_URL'): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env?.[name]) {
    return import.meta.env[name]
  }
  if (name === 'VITE_CONVEX_URL') {
    return process.env.VITE_CONVEX_URL ?? process.env.CONVEX_URL
  }
  return process.env[name]
}

/**
 * Type-safe environment variables (T3-style).
 * Loaded from `apps/web/.env.local` (see `.env.local.example`).
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_JWT_ISSUER_DOMAIN: z.string().url().optional(),
  },
  client: {
    VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    VITE_CONVEX_URL: z.string().url(),
  },
  clientPrefix: 'VITE_',
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,
    VITE_CLERK_PUBLISHABLE_KEY: viteClient('VITE_CLERK_PUBLISHABLE_KEY'),
    VITE_CONVEX_URL: viteClient('VITE_CONVEX_URL'),
  },
  emptyStringAsUndefined: true,
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION || process.env.CI === 'true',
})
