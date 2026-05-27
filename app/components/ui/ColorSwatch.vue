<script setup lang="ts">
const props = defineProps<{
  color: string
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-6 h-6'
    case 'lg': return 'w-12 h-12'
    default: return 'w-10 h-10'
  }
})
</script>

<template>
  <div
    class="rounded-full ring-1 ring-gray-200 shadow-inner flex-shrink-0"
    :class="sizeClass"
    :style="{ backgroundColor: color }"
  />
</template>
