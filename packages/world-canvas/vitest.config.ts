import { defineConfig } from 'vitest/config';

// world-canvas is a source-only React package (mostly covered by Storybook),
// but its headless simulation logic gets unit tests. The @org/source
// condition lets vitest resolve sibling @worldkit/* packages straight from
// their TypeScript sources without a build step.
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
