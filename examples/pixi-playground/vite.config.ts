import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
  },
  resolve: {
    // Resolve @worldkit/* directly to TS source via the custom export condition
    // declared in each package's package.json. No package build required.
    conditions: ['@org/source', 'browser', 'module', 'import', 'default'],
  },
});
