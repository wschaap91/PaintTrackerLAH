export default defineNuxtRouteMiddleware((to) => {
  if (!import.meta.client) return  // SSR safety (app is SPA but guard is cheap)
  if (to.path.startsWith('/auth')) return
  const token = localStorage.getItem('convex_auth_token')
  if (!token) {
    return navigateTo('/auth/login')
  }
})
