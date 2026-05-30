<script setup lang="ts">
const filters = ref({
  brand: '',
  paintType: '',
  status: '',
  q: '',
})

const { paints, isLoading } = usePaints(filters)
const showQuickAdd = ref(false)
const showImportExport = ref(false)
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Paints</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ paints?.length ?? 0 }} paints in your collection.
        </p>
      </div>
      <div class="flex gap-2">
        <NuxtLink
          to="/paints/catalog"
          class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Browse Catalog
        </NuxtLink>
        <button
          class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="showImportExport = !showImportExport"
        >
          Import/Export
        </button>
        <button
          class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="showQuickAdd = true"
        >
          Quick Add
        </button>
        <NuxtLink
          to="/paints/add"
          class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-700 transition-colors"
        >
          + Add Paint
        </NuxtLink>
      </div>
    </div>

    <div v-if="showImportExport" class="mb-6">
      <PaintImportExport :paints="paints ?? []" />
    </div>

    <PaintFilters v-model="filters" />

    <div v-if="isLoading" class="text-center py-12 text-sm text-gray-500">
      Loading...
    </div>

    <div v-else-if="!paints?.length">
      <EmptyState
        title="No paints found"
        :description="filters.q || filters.brand || filters.paintType || filters.status
          ? 'Try changing your filters.'
          : 'Add your first paint to get started.'"
        action-label="Add Paint"
        action-to="/paints/add"
      />
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <PaintCard v-for="paint in paints" :key="paint._id" :paint="paint" />
    </div>

    <button
      class="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-accent-600 text-white shadow-lg hover:bg-accent-700 transition-colors flex items-center justify-center sm:hidden"
      aria-label="Quick add paint"
      @click="showQuickAdd = true"
    >
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    </button>

    <PaintQuickAdd
      v-if="showQuickAdd"
      @close="showQuickAdd = false"
    />
  </div>
</template>
