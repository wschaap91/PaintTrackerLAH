<script setup lang="ts">
defineProps<{
  project: {
    _id: string
    name: string
    description: string | null
    schemeCount: number
    paintCount: number
    swatches: string[]
  }
}>()
</script>

<template>
  <NuxtLink :to="`/projects/${project._id}`" class="card group hover:shadow-md transition-shadow cursor-pointer block">
    <h3 class="text-sm font-medium text-gray-900 group-hover:text-accent-600 transition-colors mb-2">
      {{ project.name }}
    </h3>
    <p v-if="project.description" class="text-xs text-gray-500 mb-3 line-clamp-2">
      {{ project.description }}
    </p>
    <div v-if="project.swatches.length" class="flex items-center -space-x-2 mb-3">
      <div
        v-for="(color, i) in project.swatches.slice(0, 8)"
        :key="i"
        class="w-7 h-7 rounded-full ring-2 ring-white shadow-inner"
        :style="{ backgroundColor: color }"
      />
      <span v-if="project.swatches.length > 8" class="text-xs text-gray-500 pl-3">
        +{{ project.swatches.length - 8 }}
      </span>
    </div>
    <p class="text-xs text-gray-400">
      {{ project.schemeCount }} {{ project.schemeCount === 1 ? 'scheme' : 'schemes' }} ·
      {{ project.paintCount }} {{ project.paintCount === 1 ? 'paint' : 'paints' }}
    </p>
  </NuxtLink>
</template>
