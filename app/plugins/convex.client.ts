import { ConvexClient } from 'convex/browser'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const convexUrl = config.public.convexUrl as string

  if (!convexUrl) {
    console.warn('CONVEX_URL not set — Convex client disabled')
    return
  }

  const client = new ConvexClient(convexUrl)

  return {
    provide: {
      convex: client,
    },
  }
})
