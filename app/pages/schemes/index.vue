<script setup lang="ts">
const { data: schemes, isLoading } = useSchemes()
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Paint Schemes</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ schemes?.length ?? 0 }} schemes saved.
        </p>
      </div>
      <NuxtLink
        to="/schemes/add"
        class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-700 transition-colors"
      >
        + Create Scheme
      </NuxtLink>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-sm text-gray-500">
      Loading...
    </div>

    <EmptyState
      v-else-if="!schemes?.length"
      title="No schemes yet"
      description="Create your first paint scheme to record a recipe."
      action-label="Create Scheme"
      action-to="/schemes/add"
    />

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <SchemeCard v-for="scheme in schemes" :key="scheme._id" :scheme="scheme" />
    </div>
  </div>
</template>
