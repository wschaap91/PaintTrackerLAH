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
  if (localStorage.getItem('convex_auth_token')) {
    client.setAuth(
      async () => localStorage.getItem('convex_auth_token'),
      () => {
        // Token invalidated — clear storage and reactive auth state
        localStorage.removeItem('convex_auth_token')
        useState<boolean>('auth:isAuthenticated').value = false
      }
    )
  }

  function setAuth(token: string | null) {
    if (token) {
      localStorage.setItem('convex_auth_token', token)
      client.setAuth(
        async () => localStorage.getItem('convex_auth_token'),
        () => {
          localStorage.removeItem('convex_auth_token')
          useState<boolean>('auth:isAuthenticated').value = false
        }
      )
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
