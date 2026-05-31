<script setup lang="ts">
const route = useRoute()
const { isAuthenticated, currentUserEmail, signOut } = useAuth()
const router = useRouter()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Paints', to: '/paints' },
  { label: 'Catalog', to: '/paints/catalog' },
  { label: 'Schemes', to: '/schemes' },
  { label: 'Projects', to: '/projects' },
  { label: 'Discover', to: '/discover' },
]

const hamburgerNavItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Projects', to: '/projects' },
  { label: 'Discover', to: '/discover' },
]

const hamburgerOpen = ref(false)

function isActive(to: string): boolean {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

async function handleSignOut() {
  await signOut()
  await router.push('/auth/login')
}

function closeHamburger() {
  hamburgerOpen.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && hamburgerOpen.value) {
    closeHamburger()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

async function handleMobileSignOut() {
  closeHamburger()
  await handleSignOut()
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
        <div v-if="isAuthenticated" class="hidden sm:flex items-center gap-3">
          <span class="text-sm text-gray-500">{{ currentUserEmail }}</span>
          <button
            @click="handleSignOut"
            class="text-sm text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>
        <!-- Hamburger button — mobile only -->
        <button
          v-if="isAuthenticated"
          class="sm:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          aria-label="Open menu"
          @click="hamburgerOpen = !hamburgerOpen"
        >
          <svg
            v-if="!hamburgerOpen"
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile dropdown -->
    <div v-if="hamburgerOpen" class="sm:hidden relative z-20">
      <!-- Transparent overlay for outside click -->
      <div
        class="fixed inset-0 z-10 sm:hidden"
        aria-hidden="true"
        @click="closeHamburger"
      />
      <!-- Dropdown panel -->
      <div class="relative z-20 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <div class="mb-3 pb-3 border-b border-gray-100">
          <span class="text-sm text-gray-500 truncate block">{{ currentUserEmail }}</span>
        </div>
        <nav class="flex flex-col gap-1 mb-3">
          <NuxtLink
            v-for="item in hamburgerNavItems"
            :key="item.to"
            :to="item.to"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="isActive(item.to)
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            @click="closeHamburger"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
        <button
          class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          @click="handleMobileSignOut"
        >
          Sign out
        </button>
      </div>
    </div>
  </header>
</template>
