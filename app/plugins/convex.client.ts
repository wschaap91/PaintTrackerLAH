import { ConvexClient } from 'convex/browser'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const convexUrl = config.public.convexUrl as string

  if (!convexUrl) {
    console.warn('CONVEX_URL not set — Convex client disabled')
    return
  }

  const client = new ConvexClient(convexUrl)

  // Restore token from previous session
  const stored = localStorage.getItem('convex_auth_token')
  if (stored) {
    client.setAuth(async () => stored, () => {
      // Token invalidated — clear storage
      localStorage.removeItem('convex_auth_token')
    })
  }

  function setAuth(token: string | null) {
    if (token) {
      localStorage.setItem('convex_auth_token', token)
      client.setAuth(async () => token, () => {
        localStorage.removeItem('convex_auth_token')
      })
    } else {
      localStorage.removeItem('convex_auth_token')
      client.clearAuth()
    }
  }

  return {
    provide: {
      convex: client,
      convexSetAuth: setAuth,
    },
  }
})
