<script setup lang="ts">
defineProps<{
  scheme: {
    _id: string
    name: string
    description: string | null
    stepCount: number
    swatches: string[]
  }
}>()
</script>

<template>
  <NuxtLink :to="`/schemes/${scheme._id}`" class="card group hover:shadow-md transition-shadow cursor-pointer block">
    <h3 class="text-sm font-medium text-gray-900 group-hover:text-accent-600 transition-colors mb-2">
      {{ scheme.name }}
    </h3>
    <p v-if="scheme.description" class="text-xs text-gray-500 mb-3 line-clamp-2">
      {{ scheme.description }}
    </p>
    <div v-if="scheme.swatches.length" class="flex items-center -space-x-2 mb-3">
      <div
        v-for="(color, i) in scheme.swatches.slice(0, 6)"
        :key="i"
        class="w-7 h-7 rounded-full ring-2 ring-white shadow-inner"
        :style="{ backgroundColor: color }"
      />
      <span v-if="scheme.swatches.length > 6" class="text-xs text-gray-500 pl-3">
        +{{ scheme.swatches.length - 6 }}
      </span>
    </div>
    <p class="text-xs text-gray-400">
      {{ scheme.stepCount }} {{ scheme.stepCount === 1 ? 'step' : 'steps' }}
    </p>
  </NuxtLink>
</template>
