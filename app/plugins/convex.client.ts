import { ConvexClient } from 'convex/browser'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const convexUrl = config.public.convexUrl as string

  if (!convexUrl) {
    console.warn('CONVEX_URL not set — Convex client disabled')
    return
  }

  const client = new ConvexClient(convexUrl)

  // Shared onChange handler: Convex calls this with `true` when the server
  // confirms the token is valid, and `false` when it's been rejected/expired.
  // We must respect the boolean — previously this always cleared auth, which
  // caused logout on every page navigation (the server confirms the cached
  // token asynchronously, triggering the callback after the middleware had
  // already set isAuthenticated = true).
  function onAuthChange(isAuth: boolean) {
    if (!isAuth) {
      localStorage.removeItem('convex_auth_token')
      useState<boolean>('auth:isAuthenticated').value = false
    }
    // isAuth === true: server confirmed the token is still valid — no change needed.
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
