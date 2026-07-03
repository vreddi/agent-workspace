import { defineMain } from '@storybook/react-vite/node'
import tailwindcss from '@tailwindcss/vite'
import { defaultClientConditions } from 'vite'

export default defineMain({
  framework: '@storybook/react-vite',
  stories: [
    '../../../packages/*/src/**/*.mdx',
    '../../../packages/*/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: ['@storybook/addon-docs'],
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()]
    // Resolve @worldkit/* packages straight to TS source (see the custom
    // export condition in each package's package.json) — no build needed.
    // Vite 6+ replaces the default conditions when set, so spread them in.
    config.resolve = {
      ...config.resolve,
      conditions: [
        '@org/source',
        ...(config.resolve?.conditions ?? defaultClientConditions),
      ],
    }
    return config
  },
})
