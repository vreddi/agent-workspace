import { defineConfig } from 'vitest/config'

// Convex backend tests only, run via the root `test` script. Deliberately
// NOT named vitest.config.* — vitest walks up from package directories and
// would otherwise adopt this config for packages/* runs.
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    include: ['convex/**/*.test.ts'],
    server: { deps: { inline: ['convex-test'] } },
  },
})
