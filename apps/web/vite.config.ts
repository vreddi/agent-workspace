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

export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, WEB_ENV_DIR, '')
  const convexUrl = loaded.VITE_CONVEX_URL ?? loaded.CONVEX_URL ?? ''
  const clerkPublishableKey = loaded.VITE_CLERK_PUBLISHABLE_KEY ?? ''

  return {
    server: {
      port: 3000,
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
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      t3EnvPlugin(),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})
