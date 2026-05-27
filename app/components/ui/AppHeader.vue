<script setup lang="ts">
const route = useRoute()
const { isAuthenticated, currentUserEmail, signOut } = useAuth()
const router = useRouter()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Paints', to: '/paints' },
  { label: 'Schemes', to: '/schemes' },
  { label: 'Projects', to: '/projects' },
]

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

async function handleSignOut() {
  await signOut()
  await router.push('/auth/login')
}
</script>

<template>
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="text-lg font-semibold text-gray-900">
            PaintTracker
          </NuxtLink>
          <nav class="hidden sm:flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isActive(item.to)
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
        <div v-if="isAuthenticated" class="flex items-center gap-3">
          <span class="text-sm text-gray-500">{{ currentUserEmail }}</span>
          <button
            @click="handleSignOut"
            class="text-sm text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
