import { config as dotenvConfig } from 'dotenv'
import { resolve } from 'path'

// Explicitly load .env.local so CONVEX_URL is available even when the shell
// that started the dev server didn't have it set. c12 evaluates nuxt.config.ts
// before applying its own dotenv integration, so we load it here directly.
dotenvConfig({ path: resolve(process.cwd(), '.env.local') })

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
  ],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  typescript: {
    strict: true,
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  runtimeConfig: {
    public: {
      convexUrl: process.env.NUXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL || '',
    },
  },
})
