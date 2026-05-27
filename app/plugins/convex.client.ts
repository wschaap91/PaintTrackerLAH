import { ConvexClient } from 'convex/browser'
import { api } from '../../convex/_generated/api'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const convexUrl = config.public.convexUrl as string

  if (!convexUrl) {
    console.warn('CONVEX_URL not set — Convex client disabled')
    return
  }

  const client = new ConvexClient(convexUrl)

  // In-memory token store — authoritative source so fetchToken avoids a
  // synchronous localStorage read on every call.
  let authToken: string | null = localStorage.getItem('convex_auth_token')
  let refreshToken: string | null = localStorage.getItem('convex_refresh_token')

  function onAuthChange(isAuth: boolean) {
    if (isAuth) {
      useState<boolean>('auth:isAuthenticated').value = true
    } else {
      authToken = null
      refreshToken = null
      localStorage.removeItem('convex_auth_token')
      localStorage.removeItem('convex_refresh_token')
      useState<boolean>('auth:isAuthenticated').value = false
    }
  }

  // Convex calls this with forceRefreshToken=true ~10s before the JWT expires.
  // Exchange the stored refresh token for a fresh JWT so sessions last up to
  // 30 days without requiring the user to log in again.
  type SignInResult = { tokens?: { token: string; refreshToken?: string } | null }

  async function fetchToken({ forceRefreshToken }: { forceRefreshToken: boolean }): Promise<string | null> {
    if (!forceRefreshToken) {
      return authToken
    }
    if (refreshToken) {
      try {
        const result = await client.action(api.auth.signIn, { refreshToken }) as SignInResult
        if (result?.tokens?.token) {
          authToken = result.tokens.token
          localStorage.setItem('convex_auth_token', authToken)
          if (result.tokens.refreshToken) {
            refreshToken = result.tokens.refreshToken
            localStorage.setItem('convex_refresh_token', refreshToken)
          }
          return authToken
        }
      }
      catch {
        // Refresh failed — fall through to return null for an immediate
        // clean logout via onAuthChange(false), skipping Convex's retry loop.
      }
    }
    return null
  }

  if (authToken) {
    client.setAuth(fetchToken, onAuthChange)
  }

  function setAuth(token: string | null, newRefreshToken?: string | null) {
    authToken = token
    refreshToken = newRefreshToken ?? null
    if (token) {
      localStorage.setItem('convex_auth_token', token)
      if (newRefreshToken) {
        localStorage.setItem('convex_refresh_token', newRefreshToken)
      }
      client.setAuth(fetchToken, onAuthChange)
    }
    else {
      localStorage.removeItem('convex_auth_token')
      localStorage.removeItem('convex_refresh_token')
      // onAuthChange is intentionally omitted on sign-out — no auth state
      // notification is needed here; the next signIn call will re-register it.
      client.setAuth(async () => null)
    }
  }

  return {
    provide: {
      convex: client,
      convexSetAuth: setAuth,
    },
  }
})
