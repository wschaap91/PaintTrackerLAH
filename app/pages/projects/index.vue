<script setup lang="ts">
const { data: projects, isLoading } = useProjects()
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Projects</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ projects?.length ?? 0 }} projects.
        </p>
      </div>
      <NuxtLink
        to="/projects/add"
        class="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-700 transition-colors"
      >
        + Create Project
      </NuxtLink>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-sm text-gray-500">
      Loading...
    </div>

    <EmptyState
      v-else-if="!projects?.length"
      title="No projects yet"
      description="Create a project to organise your paint schemes."
      action-label="Create Project"
      action-to="/projects/add"
    />

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ProjectCard v-for="project in projects" :key="project._id" :project="project" />
    </div>
  </div>
</template>
