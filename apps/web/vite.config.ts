import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Load `.env*` into `process.env`, then run T3 env validation (Node-only). */
function t3EnvPlugin(): Plugin {
  return {
    name: 't3-env',
    config(_config, { mode }) {
      const loaded = loadEnv(mode, process.cwd(), '')
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

export default defineConfig({
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
  plugins: [t3EnvPlugin(), tailwindcss(), tanstackStart(), viteReact()],
})
