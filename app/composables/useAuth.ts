import { api } from '../../convex/_generated/api'

export function useAuth() {
  const { $convex, $convexSetAuth } = useNuxtApp()

  const isAuthenticated = useState('auth:isAuthenticated', () => false)
  const currentUserEmail = useState<string | null>('auth:email', () => null)
  const isLoading = useState('auth:isLoading', () => false)
  const error = useState<string | null>('auth:error', () => null)

  // Check if we have a stored token on mount
  onMounted(() => {
    const token = localStorage.getItem('convex_auth_token')
    if (token) {
      isAuthenticated.value = true
      // Try to decode email from JWT payload (base64)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        currentUserEmail.value = payload.email ?? null
      } catch {
        // ignore decode errors
      }
    }
  })

  async function signIn(email: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const result = await $convex.action(api.auth.signIn, {
        provider: 'password',
        params: { email, password, flow: 'signIn' },
      }) as { tokens?: { token: string } }

      if (result?.tokens?.token) {
        $convexSetAuth(result.tokens.token)
        isAuthenticated.value = true
        try {
          const payload = JSON.parse(atob(result.tokens.token.split('.')[1]))
          currentUserEmail.value = payload.email ?? email
        } catch {
          currentUserEmail.value = email
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sign in failed'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function signUp(email: string, password: string) {
    isLoading.value = true
    error.value = null
    try {
      const result = await $convex.action(api.auth.signIn, {
        provider: 'password',
        params: { email, password, flow: 'signUp' },
      }) as { tokens?: { token: string } }

      if (result?.tokens?.token) {
        $convexSetAuth(result.tokens.token)
        isAuthenticated.value = true
        currentUserEmail.value = email
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Sign up failed'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function signOut() {
    isLoading.value = true
    try {
      await $convex.action(api.auth.signOut, {})
    } catch {
      // ignore errors, clear locally anyway
    } finally {
      $convexSetAuth(null)
      isAuthenticated.value = false
      currentUserEmail.value = null
      isLoading.value = false
    }
  }

  return { isAuthenticated, currentUserEmail, isLoading, error, signIn, signUp, signOut }
}
