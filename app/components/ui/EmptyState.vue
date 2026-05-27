<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
}>()
</script>

<template>
  <div class="text-center py-12">
    <div class="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <slot name="icon">
        <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.75 7.5h16.5" />
        </svg>
      </slot>
    </div>
    <h3 class="text-sm font-medium text-gray-900">{{ title }}</h3>
    <p v-if="description" class="mt-1 text-sm text-gray-500">{{ description }}</p>
    <div v-if="actionLabel && actionTo" class="mt-4">
      <NuxtLink
        :to="actionTo"
        class="inline-flex items-center rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-700 transition-colors"
      >
        {{ actionLabel }}
      </NuxtLink>
    </div>
  </div>
</template>
