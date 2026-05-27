import { ConvexClient } from 'convex/browser'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const convexUrl = config.public.convexUrl as string

  if (!convexUrl) {
    console.warn('CONVEX_URL not set — Convex client disabled')
    return
  }

  const client = new ConvexClient(convexUrl)

  // Only clear auth on rejection; true means server confirmed the token is valid.
  function onAuthChange(isAuth: boolean) {
    if (isAuth) {
      useState<boolean>('auth:isAuthenticated').value = true
    } else {
      localStorage.removeItem('convex_auth_token')
      useState<boolean>('auth:isAuthenticated').value = false
    }
  }

  // Restore token from previous session
  if (localStorage.getItem('convex_auth_token')) {
    client.setAuth(
      async () => localStorage.getItem('convex_auth_token'),
      onAuthChange,
    )
  }

  function setAuth(token: string | null) {
    if (token) {
      localStorage.setItem('convex_auth_token', token)
      client.setAuth(
        async () => localStorage.getItem('convex_auth_token'),
        onAuthChange,
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
