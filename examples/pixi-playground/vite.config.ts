import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
  },
  resolve: {
    // Resolve @worldkit/* directly to TS source via the custom export condition
    // declared in each package's package.json. No package build required.
    // Vite 6+ replaces the defaults when conditions are set, so spread them
    // back in (see apps/web/vite.config.ts).
    conditions: ['@org/source', ...defaultClientConditions],
  },
});
