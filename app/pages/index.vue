<script setup lang="ts">
const { paints } = usePaints()
const { data: schemes } = useSchemes()
const { data: projects } = useProjects()

const stats = computed(() => {
  const list = paints.value ?? []
  return {
    total: list.length,
    owned: list.filter(p => p.status === 'owned').length,
    runningLow: list.filter(p => p.status === 'running_low').length,
    empty: list.filter(p => p.status === 'empty').length,
    wishlist: list.filter(p => p.status === 'wishlist').length,
  }
})

const recentPaints = computed(() => {
  const list = paints.value ?? []
  return [...list].sort((a, b) => b._creationTime - a._creationTime).slice(0, 8)
})

const recentSchemes = computed(() => (schemes.value ?? []).slice(0, 3))
const recentProjects = computed(() => (projects.value ?? []).slice(0, 3))
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">Your miniature paint collection at a glance.</p>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
      <div class="card">
        <p class="text-sm text-gray-500">Total</p>
        <p class="text-2xl font-semibold text-gray-900 mt-1">{{ stats.total }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Owned</p>
        <p class="text-2xl font-semibold text-emerald-600 mt-1">{{ stats.owned }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Running Low</p>
        <p class="text-2xl font-semibold text-amber-600 mt-1">{{ stats.runningLow }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Empty</p>
        <p class="text-2xl font-semibold text-red-600 mt-1">{{ stats.empty }}</p>
      </div>
      <div class="card">
        <p class="text-sm text-gray-500">Wishlist</p>
        <p class="text-2xl font-semibold text-blue-600 mt-1">{{ stats.wishlist }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-medium text-gray-700">Recent Schemes</h2>
          <NuxtLink to="/schemes" class="text-xs text-accent-600 hover:text-accent-700 font-medium">
            View all &rarr;
          </NuxtLink>
        </div>
        <div v-if="recentSchemes.length" class="space-y-2">
          <SchemeCard v-for="scheme in recentSchemes" :key="scheme._id" :scheme="scheme" />
        </div>
        <div v-else class="card text-center text-sm text-gray-500 py-6">
          No schemes yet.
        </div>
      </div>

      <div>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-medium text-gray-700">Recent Projects</h2>
          <NuxtLink to="/projects" class="text-xs text-accent-600 hover:text-accent-700 font-medium">
            View all &rarr;
          </NuxtLink>
        </div>
        <div v-if="recentProjects.length" class="space-y-2">
          <ProjectCard v-for="project in recentProjects" :key="project._id" :project="project" />
        </div>
        <div v-else class="card text-center text-sm text-gray-500 py-6">
          No projects yet.
        </div>
      </div>
    </div>

    <div v-if="recentPaints.length">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-medium text-gray-700">Recent Paints</h2>
        <NuxtLink to="/paints" class="text-xs text-accent-600 hover:text-accent-700 font-medium">
          View all &rarr;
        </NuxtLink>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PaintCard v-for="paint in recentPaints" :key="paint._id" :paint="paint" />
      </div>
    </div>

    <EmptyState
      v-if="!recentPaints.length"
      title="Welcome to PaintTracker"
      description="Start by adding your first paint to your collection."
      action-label="Add Paint"
      action-to="/paints/add"
    />
  </div>
</template>
