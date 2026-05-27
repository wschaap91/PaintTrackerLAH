<script setup lang="ts">
const props = defineProps<{
  status: string
}>()

const badgeConfig = computed(() => {
  switch (props.status) {
    case 'owned':
      return { label: 'Owned', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' }
    case 'running_low':
      return { label: 'Running Low', classes: 'bg-amber-50 text-amber-700 ring-amber-600/20' }
    case 'empty':
      return { label: 'Empty', classes: 'bg-red-50 text-red-700 ring-red-600/20' }
    case 'wishlist':
      return { label: 'Wishlist', classes: 'bg-blue-50 text-blue-700 ring-blue-600/20' }
    default:
      return { label: props.status, classes: 'bg-gray-50 text-gray-700 ring-gray-600/20' }
  }
})
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="badgeConfig.classes"
  >
    {{ badgeConfig.label }}
  </span>
</template>
