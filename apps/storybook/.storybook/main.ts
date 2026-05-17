import { defineMain } from '@storybook/react-vite/node'
import tailwindcss from '@tailwindcss/vite'

export default defineMain({
  framework: '@storybook/react-vite',
  stories: [
    '../../../packages/*/src/**/*.mdx',
    '../../../packages/*/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: ['@storybook/addon-docs'],
  viteFinal: async (config) => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()]
    return config
  },
})
