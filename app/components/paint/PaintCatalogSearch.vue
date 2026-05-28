<script setup lang="ts">
import type { FunctionReturnType } from 'convex/server'
import { api } from '../../../convex/_generated/api'

type CatalogPaint = FunctionReturnType<typeof api.catalogSync.searchCatalog>[number]

const emit = defineEmits<{
  select: [paint: CatalogPaint]
}>()

const { query, results, isLoading, error } = useCatalogSearch()
const inputValue = ref('')
const wrapper = ref<HTMLElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (debounceTimer !== null) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    query.value = inputValue.value
    debounceTimer = null
  }, 300)
}

function onSelect(paint: CatalogPaint) {
  emit('select', paint)
  inputValue.value = ''
  query.value = ''
}

function onClickOutside(event: MouseEvent) {
  if (wrapper.value && !wrapper.value.contains(event.target as Node)) {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    debounceTimer = null
    inputValue.value = ''
    query.value = ''
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
  if (debounceTimer !== null) clearTimeout(debounceTimer)
})

const showDropdown = computed(() => inputValue.value.trim().length >= 2)
</script>

<template>
  <div ref="wrapper" class="relative">
    <input
      v-model="inputValue"
      type="text"
      placeholder="Search catalog..."
      class="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 w-full"
      @input="onInput"
    />
    <div
      v-if="showDropdown"
      class="absolute left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg z-50"
    >
      <div v-if="isLoading" class="p-3 text-sm text-gray-500">
        Loading...
      </div>
      <div v-else-if="error" class="p-3 text-sm text-red-500">
        Search failed. Please try again.
      </div>
      <div v-else-if="results && results.length === 0" class="p-3 text-sm text-gray-500">
        No results
      </div>
      <ul v-else-if="results">
        <li
          v-for="result in results"
          :key="result._id"
          class="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-50 cursor-pointer"
          @click="onSelect(result)"
        >
          <ColorSwatch size="sm" :color="result.hexColor ?? '#888888'" />
          <div class="text-sm">
            <span class="font-medium">{{ result.name }}</span>
            <span class="text-gray-500 ml-1">{{ result.brand }}</span>
            <span v-if="result.range" class="text-gray-400 ml-1">· {{ result.range }}</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
