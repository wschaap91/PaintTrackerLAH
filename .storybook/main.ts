import type { StorybookConfig } from '@storybook/vue3-vite'
import { resolve } from 'path'

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  viteFinal(config) {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...config.resolve.alias,
      '~': resolve(__dirname, '../app'),
      '@': resolve(__dirname, '../app'),
    }
    return config
  },
  docs: {
    autodocs: true,
  },
}

export default config
