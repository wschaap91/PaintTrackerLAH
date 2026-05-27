export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return  // SSR safety (app is SPA but guard is cheap)
  if (to.path.startsWith('/auth') || to.path.startsWith('/s/') || to.path === '/discover') return
  const isAuthenticated = useState('auth:isAuthenticated', () => !!localStorage.getItem('convex_auth_token'))
  if (!isAuthenticated.value) {
    return navigateTo('/auth/login')
  }
})
