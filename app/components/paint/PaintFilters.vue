<script setup lang="ts">
const filters = defineModel<{
  brand: string
  paintType: string
  status: string
  q: string
}>({ required: true })

defineProps<{ brands: string[] }>()

const types = ['', 'base', 'layer', 'shade', 'contrast', 'dry', 'technical', 'primer', 'spray']
const statuses = ['', 'owned', 'running_low', 'empty', 'wishlist']

function formatLabel(value: string): string {
  if (!value) return ''
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end gap-3 mb-6">
    <div class="flex flex-col gap-1 sm:col-span-2 lg:w-64">
      <label for="paint-search" class="text-xs font-medium text-gray-500">Search</label>
      <input
        id="paint-search"
        v-model="filters.q"
        type="text"
        placeholder="Search paints..."
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
      >
    </div>
    <div class="flex flex-col gap-1">
      <label for="paint-brand" class="text-xs font-medium text-gray-500">Brand</label>
      <select
        id="paint-brand"
        v-model="filters.brand"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
        <option value="">All Brands</option>
        <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
      </select>
    </div>
    <div class="flex flex-col gap-1">
      <label for="paint-type" class="text-xs font-medium text-gray-500">Type</label>
      <select
        id="paint-type"
        v-model="filters.paintType"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
        <option v-for="t in types" :key="t" :value="t">{{ formatLabel(t) || 'All Types' }}</option>
      </select>
    </div>
    <div class="flex flex-col gap-1">
      <label for="paint-status" class="text-xs font-medium text-gray-500">Status</label>
      <select
        id="paint-status"
        v-model="filters.status"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
        <option v-for="s in statuses" :key="s" :value="s">{{ formatLabel(s) || 'All Statuses' }}</option>
      </select>
    </div>
  </div>
</template>
