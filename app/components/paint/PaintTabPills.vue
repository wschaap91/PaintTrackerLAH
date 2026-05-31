<script setup lang="ts">
type TabValue = 'all' | 'owned' | 'wishlist'

const props = defineProps<{
  modelValue: TabValue
  ownedCount: number
  wishlistCount: number
}>()

const emit = defineEmits<{
  'update:modelValue': [TabValue]
}>()

const tabs = computed(() => [
  { key: 'all' as const, label: 'All' },
  { key: 'owned' as const, label: `Owned (${props.ownedCount})` },
  { key: 'wishlist' as const, label: `Wishlist (${props.wishlistCount})` },
])
</script>

<template>
  <div class="flex w-full">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.key"
      class="flex-1 px-4 py-2 text-sm font-medium border transition-colors"
      :class="[
        modelValue === tab.key
          ? 'bg-accent-600 text-white border-accent-600 z-10'
          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
        index === 0 ? 'rounded-l-full' : '-ml-px',
        index === tabs.length - 1 ? 'rounded-r-full' : '',
      ]"
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
