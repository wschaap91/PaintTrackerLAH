<script setup lang="ts">
const filters = defineModel<{
  brand: string
  range: string
  colorFamily: string
  q: string
  hideOwned: boolean
}>({ required: true })

defineProps<{
  ranges: string[]
  brands: string[]
}>()

const colorFamilies = ['', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'grey', 'metallic']

watch(() => filters.value.brand, () => {
  filters.value.range = ''
})
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-end gap-3 mb-6">
    <div class="flex flex-col gap-1 col-span-2 sm:col-span-3 lg:w-64">
      <label for="catalog-search" class="text-xs font-medium text-gray-600">Search</label>
      <input
        id="catalog-search"
        v-model="filters.q"
        type="text"
        placeholder="Search paints..."
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
      >
    </div>

    <div class="flex flex-col gap-1">
      <label for="catalog-brand" class="text-xs font-medium text-gray-600">Brand</label>
      <select
        id="catalog-brand"
        v-model="filters.brand"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
        <option value="">All Brands</option>
        <option v-for="b in brands" :key="b" :value="b">{{ b }}</option>
      </select>
    </div>

    <div class="flex flex-col gap-1">
      <label for="catalog-range" class="text-xs font-medium text-gray-600">Range</label>
      <select
        id="catalog-range"
        v-model="filters.range"
        :disabled="!filters.brand"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">All Ranges</option>
        <option v-for="r in ranges" :key="r" :value="r">{{ r }}</option>
      </select>
    </div>

    <div class="flex flex-col gap-1">
      <label for="catalog-color" class="text-xs font-medium text-gray-600">Color</label>
      <select
        id="catalog-color"
        v-model="filters.colorFamily"
        class="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
      >
        <option v-for="c in colorFamilies" :key="c" :value="c">{{ c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All Colors' }}</option>
      </select>
    </div>

    <label for="catalog-hide-owned" class="flex items-center gap-2 py-2 cursor-pointer select-none">
      <input
        id="catalog-hide-owned"
        v-model="filters.hideOwned"
        type="checkbox"
        class="h-5 w-5 rounded border-gray-300 text-accent-600 focus:ring-2 focus:ring-accent-500"
      >
      <span class="text-sm text-gray-700">Hide owned</span>
    </label>
  </div>
</template>
