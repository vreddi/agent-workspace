import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

/**
 * Type-safe environment variables (T3-style).
 * @see https://env.t3.gg/docs/core
 *
 * Import this module to validate env. Server vars come from `process.env`
 * (WorkOS AuthKit). Client vars use the `VITE_` prefix.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    WORKOS_CLIENT_ID: z.string().min(1),
    WORKOS_API_KEY: z.string().min(1),
    WORKOS_REDIRECT_URI: z.string().url(),
    WORKOS_COOKIE_PASSWORD: z.string().min(32),
    WORKOS_COOKIE_MAX_AGE: z.coerce.number().optional(),
    WORKOS_COOKIE_NAME: z.string().optional(),
    WORKOS_COOKIE_DOMAIN: z.string().optional(),
    WORKOS_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).optional(),
  },
  client: {
    VITE_CONVEX_URL: z.string().url(),
  },
  clientPrefix: 'VITE_',
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    WORKOS_CLIENT_ID: process.env.WORKOS_CLIENT_ID,
    WORKOS_API_KEY: process.env.WORKOS_API_KEY,
    WORKOS_REDIRECT_URI: process.env.WORKOS_REDIRECT_URI,
    WORKOS_COOKIE_PASSWORD: process.env.WORKOS_COOKIE_PASSWORD,
    WORKOS_COOKIE_MAX_AGE: process.env.WORKOS_COOKIE_MAX_AGE,
    WORKOS_COOKIE_NAME: process.env.WORKOS_COOKIE_NAME,
    WORKOS_COOKIE_DOMAIN: process.env.WORKOS_COOKIE_DOMAIN,
    WORKOS_COOKIE_SAMESITE: process.env.WORKOS_COOKIE_SAMESITE,
    VITE_CONVEX_URL:
      typeof import.meta !== 'undefined' && import.meta.env
        ? import.meta.env.VITE_CONVEX_URL
        : process.env.VITE_CONVEX_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION || process.env.CI === 'true',
})
