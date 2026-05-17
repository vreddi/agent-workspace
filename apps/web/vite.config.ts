import path from 'node:path'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const WEB_ENV_DIR = path.resolve(__dirname)

/** Load `apps/web/.env.local` (and friends) into `process.env`, then validate. */
function t3EnvPlugin(): Plugin {
  return {
    name: 't3-env',
    config(_config, { mode }) {
      const loaded = loadEnv(mode, WEB_ENV_DIR, '')
      for (const [key, value] of Object.entries(loaded)) {
        if (process.env[key] === undefined) {
          process.env[key] = value
        }
      }
    },
    async buildStart() {
      await import('./src/env.ts')
    },
  }
}

/**
 * Replaces `use-sync-external-store/shim/index.js` with a pass-through to
 * React's native `useSyncExternalStore`.
 *
 * The shim's `module.exports = require('../cjs/…')` pattern and the inner
 * cjs file's NODE_ENV-guarded IIFE are both invisible to Vite's
 * cjs-module-lexer, so the named `useSyncExternalStore` ESM export is
 * never synthesized. Consumers (`@radix-ui/react-use-is-hydrated`, and
 * `swr` via `@clerk/shared`) fail to import it, client hydration aborts,
 * and Clerk's <SignInButton> click handler never attaches.
 *
 * React 19 ships `useSyncExternalStore` natively, so the shim's
 * fallback-to-userland-hook behaviour is unnecessary — re-export React's
 * implementation directly.
 */
function fixUseSyncExternalStoreShim(): Plugin {
  const shimSuffix = '/use-sync-external-store/shim/index.js'
  return {
    name: 'fix-use-sync-external-store-shim',
    enforce: 'pre',
    load(id) {
      const cleanId = id.split('?')[0]
      if (!cleanId.endsWith(shimSuffix)) return
      return `export { useSyncExternalStore } from 'react'\n`
    },
  }
}

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, WEB_ENV_DIR, '')
  const convexUrl = loaded.VITE_CONVEX_URL ?? loaded.CONVEX_URL ?? ''
  const clerkPublishableKey = loaded.VITE_CLERK_PUBLISHABLE_KEY ?? ''

  return {
    server: {
      port: 3000,
    },
    optimizeDeps: {
      include: [
        'use-sync-external-store/shim',
        'use-sync-external-store/shim/with-selector',
      ],
    },
    resolve: {
      tsconfigPaths: true,
      alias: {
        '~': path.resolve(__dirname, './src'),
        '@convex': path.resolve(__dirname, '../../convex'),
      },
    },
    define: {
      ...(convexUrl
        ? { 'import.meta.env.VITE_CONVEX_URL': JSON.stringify(convexUrl) }
        : {}),
      ...(clerkPublishableKey
        ? {
            'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY':
              JSON.stringify(clerkPublishableKey),
          }
        : {}),
    },
    plugins: [
      fixUseSyncExternalStoreShim(),
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      t3EnvPlugin(),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})
