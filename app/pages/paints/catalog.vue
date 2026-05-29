<script setup lang="ts">
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

const { filters, results, isLoading, error, ownedIds, loadMore, hasMore, availableRanges } = useCatalogBrowse()

const addFromCatalog = useConvexMutation(api.catalogSync.addFromCatalog)

const addError = ref<string | null>(null)

async function handleAdd(catalogPaintId: string) {
  addError.value = null
  try {
    await addFromCatalog({ catalogPaintId: catalogPaintId as Id<'catalogPaints'> })
  } catch (err) {
    addError.value = err instanceof Error ? err.message : 'Failed to add paint'
  }
}

const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting && hasMore.value && !isLoading.value) {
        loadMore()
      }
    },
    { rootMargin: '200px' }
  )
})

watch(sentinelRef, (el) => {
  if (el && observer) observer.observe(el)
}, { immediate: true })

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <NuxtLink
            to="/paints"
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Paints
          </NuxtLink>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">Paint Catalog</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ results.length }} paint{{ results.length === 1 ? '' : 's' }} found
        </p>
      </div>
    </div>

    <div
      v-if="addError"
      class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ addError }}
      <button
        class="ml-2 underline hover:no-underline"
        @click="addError = null"
      >
        Dismiss
      </button>
    </div>

    <div
      v-if="error"
      class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      Failed to load catalog: {{ error.message }}
    </div>

    <CatalogFilters v-model="filters" :ranges="availableRanges" />

    <div v-if="isLoading && results.length === 0" class="text-center py-12 text-sm text-gray-500">
      Loading...
    </div>

    <div v-else-if="!isLoading && results.length === 0 && !error">
      <EmptyState
        title="No paints found"
        description="Try adjusting your filters or search term."
      />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <CatalogPaintCard
        v-for="paint in results"
        :key="paint._id"
        :paint="paint"
        :owned="ownedIds.has(paint._id as string)"
        @add="handleAdd"
      />
    </div>

    <div
      v-if="isLoading && results.length > 0"
      class="mt-8 flex justify-center"
    >
      <div class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-accent-600" />
    </div>

    <div ref="sentinelRef" class="h-px" />
  </div>
</template>
