export default defineNuxtRouteMiddleware((to) => {
  // Skip auth pages
  if (to.path.startsWith('/auth')) return

  const token = localStorage.getItem('convex_auth_token')
  if (!token) {
    return navigateTo('/auth/login')
  }
})
