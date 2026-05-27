<script setup lang="ts">
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

const client = useConvexClient()
const schemes = ref<any[]>([])
const isLoading = ref(true)
const cloning = ref<string | null>(null)
const cloneSuccess = ref<string | null>(null)
const { isAuthenticated } = useAuth()
const router = useRouter()

onMounted(async () => {
  const result = await client.query(api.schemes.listPublicSchemes, {})
  schemes.value = result ?? []
  isLoading.value = false
})

const filteredSchemes = computed(() => {
  return schemes.value
})

async function clone(schemeId: string) {
  if (!isAuthenticated.value) {
    await router.push('/auth/login')
    return
  }
  cloning.value = schemeId
  try {
    await client.mutation(api.schemes.cloneScheme, { schemeId: schemeId as Id<'schemes'> })
    cloneSuccess.value = schemeId
    setTimeout(() => { cloneSuccess.value = null }, 2000)
  } catch (e) {
    console.error('Clone failed', e)
  } finally {
    cloning.value = null
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-gray-900">Discover Schemes</h1>
      <p class="mt-1 text-sm text-gray-500">Browse paint schemes shared by the community.</p>
    </div>

    <div v-if="isLoading" class="text-center py-16 text-gray-400">Loading…</div>

    <div v-else-if="filteredSchemes.length === 0" class="text-center py-16">
      <p class="text-gray-500">No public schemes yet. Be the first to share one!</p>
      <NuxtLink to="/schemes" class="mt-4 inline-block text-sm text-gray-700 hover:underline">
        Go to My Schemes
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="scheme in filteredSchemes"
        :key="scheme._id"
        class="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-3"
      >
        <div class="flex-1">
          <h2 class="text-sm font-medium text-gray-900">{{ scheme.name }}</h2>
          <p v-if="scheme.description" class="text-xs text-gray-500 mt-0.5 line-clamp-2">
            {{ scheme.description }}
          </p>
          <p class="text-xs text-gray-400 mt-1">{{ scheme.stepCount }} steps</p>
        </div>

        <div class="flex items-center gap-1">
          <div
            v-for="(color, i) in scheme.swatches"
            :key="i"
            class="w-5 h-5 rounded-full border border-gray-200"
            :style="{ backgroundColor: color }"
          />
          <span v-if="scheme.swatches.length === 0" class="text-xs text-gray-400">No paints</span>
        </div>

        <div class="flex items-center justify-between gap-2">
          <NuxtLink
            :to="`/s/${scheme.slug}`"
            class="text-xs text-gray-500 hover:text-gray-700 hover:underline"
          >
            View →
          </NuxtLink>
          <button
            @click="clone(scheme._id)"
            :disabled="cloning === scheme._id"
            class="text-xs bg-gray-900 text-white rounded px-3 py-1.5 hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {{ cloneSuccess === scheme._id ? 'Cloned!' : cloning === scheme._id ? 'Cloning…' : 'Clone' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
