<script setup lang="ts">
import { api } from '../../convex/_generated/api'

const client = useConvexClient()

const schemes = ref<any[]>([])
const hasMore = ref(false)
const isLoading = ref(true)
const isLoadingMore = ref(false)
const cloning = ref<string | null>(null)
const cloneSuccess = ref<string | null>(null)
const { isAuthenticated } = useAuth()
const router = useRouter()

const sortBy = ref<'recent' | 'popular'>('recent')
const filterTechnique = ref('')
const error = ref('')
const loadMoreError = ref('')
const LIMIT = 24

async function load(reset = false) {
  error.value = ''
  loadMoreError.value = ''

  if (reset) {
    schemes.value = []
    isLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  const offset = reset ? 0 : schemes.value.length

  try {
    const result = await client.query(api.schemes.listPublicSchemes, {
      limit: LIMIT,
      offset,
      sortBy: sortBy.value,
    })

    if (result) {
      if (reset) {
        schemes.value = result.schemes
      } else {
        schemes.value = [...schemes.value, ...result.schemes]
      }
      hasMore.value = result.hasMore
    }
  } catch (e) {
    console.error('Failed to load public schemes', e)
    if (reset) {
      error.value = 'Something went wrong while loading schemes. Please try again.'
    } else {
      loadMoreError.value = 'Failed to load more schemes. Please try again.'
    }
  } finally {
    if (reset) isLoading.value = false
    else isLoadingMore.value = false
  }
}

onMounted(() => load(true))

watch(sortBy, () => load(true))

const allTechniques = computed(() => {
  const set = new Set<string>()
  for (const s of schemes.value) {
    for (const t of (s.techniques ?? [])) set.add(t)
  }
  return Array.from(set).sort()
})

const filteredSchemes = computed(() => {
  if (!filterTechnique.value) return schemes.value
  return schemes.value.filter(s => (s.techniques ?? []).includes(filterTechnique.value))
})

function formatTechnique(t: string): string {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
}

async function clone(schemeId: string) {
  if (!isAuthenticated.value) {
    await router.push('/auth/login')
    return
  }
  cloning.value = schemeId
  try {
    await client.mutation(api.schemes.cloneScheme, { schemeId: schemeId as any })
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
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Discover Schemes</h1>
      <p class="mt-1 text-sm text-gray-500">Browse paint schemes shared by the community.</p>
    </div>

    <!-- Controls -->
    <div class="mb-6 flex flex-wrap items-center gap-3">
      <!-- Sort toggle -->
      <div class="flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          v-for="mode in (['recent', 'popular'] as const)"
          :key="mode"
          @click="sortBy = mode"
          :class="sortBy === mode ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
          class="px-4 py-2 text-sm font-medium transition-colors capitalize"
        >
          {{ mode }}
        </button>
      </div>

      <!-- Technique filter -->
      <select
        v-if="allTechniques.length > 0"
        v-model="filterTechnique"
        class="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none"
      >
        <option value="">All techniques</option>
        <option v-for="t in allTechniques" :key="t" :value="t">
          {{ formatTechnique(t) }}
        </option>
      </select>
    </div>

    <div v-if="isLoading" class="text-center py-16 text-gray-400">Loading…</div>

    <div v-else-if="error" class="text-center py-16">
      <p class="text-gray-500">{{ error }}</p>
      <button
        @click="load(true)"
        class="mt-4 inline-block text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
      >
        Try again
      </button>
    </div>

    <div v-else-if="filteredSchemes.length === 0" class="text-center py-16">
      <p class="text-gray-500">No public schemes found.</p>
      <NuxtLink to="/schemes" class="mt-4 inline-block text-sm text-gray-700 hover:underline">
        Share one from My Schemes
      </NuxtLink>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          <div class="flex items-center gap-1 flex-wrap">
            <div
              v-for="(color, i) in scheme.swatches"
              :key="i"
              class="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0"
              :style="{ backgroundColor: color }"
            />
            <span v-if="scheme.swatches.length === 0" class="text-xs text-gray-400">No paints</span>
          </div>

          <div class="flex items-center justify-between gap-2">
            <NuxtLink
              :to="`/s/${scheme.slug}`"
              class="text-sm text-gray-500 hover:text-gray-700 hover:underline py-1"
            >
              View →
            </NuxtLink>
            <button
              @click="clone(scheme._id)"
              :disabled="cloning === scheme._id"
              class="text-sm bg-gray-900 text-white rounded-lg px-3 py-2 hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {{ cloneSuccess === scheme._id ? 'Cloned!' : cloning === scheme._id ? 'Cloning…' : 'Clone' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Load more error (inline, does not replace the grid) -->
      <p v-if="loadMoreError" class="mt-6 text-center text-sm text-red-500">{{ loadMoreError }}</p>

      <!-- Load more -->
      <div v-if="hasMore && !filterTechnique" class="mt-8 text-center">
        <button
          @click="load(false)"
          :disabled="isLoadingMore"
          class="text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {{ isLoadingMore ? 'Loading…' : 'Load more' }}
        </button>
      </div>
    </div>
  </div>
</template>
