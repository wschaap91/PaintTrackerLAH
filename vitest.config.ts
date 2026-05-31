import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
    }),
  ],
  resolve: {
    alias: {
      '~': resolve(__dirname, 'app'),
      '@': resolve(__dirname, 'app'),
    },
  },
  esbuild: {
    tsconfigRaw: '{}',
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    root: '.',
    include: ['app/**/*.test.ts'],
  },
})
