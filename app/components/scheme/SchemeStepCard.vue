<script setup lang="ts">
defineProps<{
  index: number
  paint: { name: string; brand: string; hexColor: string } | null
  technique: string
  notes?: string | null
}>()
</script>

<template>
  <li class="card flex items-start gap-4">
    <div class="text-xs font-mono text-gray-400 mt-1 w-6">{{ index }}.</div>
    <ColorSwatch :color="paint?.hexColor || '#e5e7eb'" />
    <div class="flex-1">
      <div class="flex items-center gap-2 flex-wrap">
        <p class="text-sm font-medium text-gray-900">
          {{ paint?.name || 'Paint removed' }}
        </p>
        <span v-if="paint" class="text-xs text-gray-400">{{ paint.brand }}</span>
      </div>
      <p class="text-xs text-accent-600 mt-0.5">{{ formatTechnique(technique) }}</p>
      <p v-if="notes" class="text-xs text-gray-500 mt-1">{{ notes }}</p>
    </div>
  </li>
</template>
