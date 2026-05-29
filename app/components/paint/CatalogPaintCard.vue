<script setup lang="ts">
const props = defineProps<{
  paint: {
    _id: string
    name: string
    brand: string
    range: string
    hexColor: string | null
    paintType: string
    brandCode: string
  }
  owned: boolean
}>()

const emit = defineEmits<{
  add: [id: string]
}>()

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
</script>

<template>
  <div class="card">
    <div class="flex items-start gap-3">
      <ColorSwatch :color="paint.hexColor ?? '#ccc'" size="sm" />
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-medium text-gray-900 truncate">
          {{ paint.name }}
        </h3>
        <p class="text-xs text-gray-500 mt-0.5">{{ paint.brand }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ paint.range }}</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-xs text-gray-400">{{ formatType(paint.paintType) }}</span>
          <span
            v-if="owned"
            class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-600/20"
          >
            Owned
          </span>
          <button
            v-else
            type="button"
            class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-accent-600 text-white hover:bg-accent-700 transition-colors"
            @click="emit('add', props.paint._id)"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
