import type { AuthConfig } from 'convex/server'

export default {
  providers: [
    {
      // From Clerk Dashboard → JWT templates → "convex" → Issuer URL
      // Set CLERK_JWT_ISSUER_DOMAIN on Convex (pnpm convex:env:sync)
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: 'convex',
    },
  ],
} satisfies AuthConfig
