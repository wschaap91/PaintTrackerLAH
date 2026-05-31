<script setup lang="ts">
export interface PaintSearchFilters {
  q: string
  brand: string
  paintType: string
}

const props = withDefaults(defineProps<{
  modelValue: PaintSearchFilters
  brands: string[]
  placeholder?: string
}>(), {
  placeholder: 'Search paints…',
})

const emit = defineEmits<{
  'update:modelValue': [PaintSearchFilters]
}>()

const filtersOpen = ref(false)

const types = ['base', 'layer', 'shade', 'contrast', 'dry', 'technical', 'primer', 'spray']

const hasActiveFilters = computed(() =>
  props.modelValue.brand !== '' || props.modelValue.paintType !== ''
)

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function update(patch: Partial<PaintSearchFilters>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          :value="modelValue.q"
          :placeholder="placeholder"
          class="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          @input="update({ q: ($event.target as HTMLInputElement).value })"
        >
      </div>
      <button
        class="relative flex-shrink-0 p-2.5 rounded-lg border transition-colors"
        :class="filtersOpen || hasActiveFilters
          ? 'border-accent-500 text-accent-600 bg-accent-50'
          : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
        aria-label="Toggle filters"
        @click="filtersOpen = !filtersOpen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75M10.5 18a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 18H7.5m6-6h6.75m-6.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5" />
        </svg>
        <span
          v-if="hasActiveFilters && !filtersOpen"
          class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent-600"
        />
      </button>
    </div>

    <div v-if="filtersOpen" class="flex flex-col gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 mt-2">
      <select
        :value="modelValue.brand"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
        @change="update({ brand: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">All Brands</option>
        <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
      </select>
      <select
        :value="modelValue.paintType"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
        @change="update({ paintType: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">All Types</option>
        <option v-for="t in types" :key="t" :value="t">{{ formatLabel(t) }}</option>
      </select>
    </div>
  </div>
</template>
