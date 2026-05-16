import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['@org/source'],
  },
  ssr: {
    resolve: {
      conditions: ['@org/source'],
      externalConditions: ['@org/source'],
    },
  },
});
