<script setup lang="ts">
defineProps<{
  paint: {
    _id: string
    brand: string
    name: string
    paintType: string
    hexColor: string
    status: string
  }
}>()

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
</script>

<template>
  <NuxtLink :to="`/paints/${paint._id}`" class="card group hover:shadow-md transition-shadow cursor-pointer">
    <div class="flex items-start gap-3">
      <ColorSwatch :color="paint.hexColor" />
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-medium text-gray-900 truncate group-hover:text-accent-600 transition-colors">
          {{ paint.name }}
        </h3>
        <p class="text-xs text-gray-500 mt-0.5">{{ paint.brand }}</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs text-gray-400">{{ formatType(paint.paintType) }}</span>
          <StatusBadge :status="paint.status" />
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
