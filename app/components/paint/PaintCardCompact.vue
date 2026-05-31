<script setup lang="ts">
import { getBrandColor } from '~/utils/brandColors'

const props = defineProps<{
  paint: {
    _id: string
    name: string
    brand: string
    hexColor: string | null
    paintType: string
    status?: string
    catalogPaintId?: string
  }
  isOwned?: boolean
  isWishlisted?: boolean
}>()

const emit = defineEmits<{
  toggleOwned: [paintId: string]
  toggleWishlist: [paintId: string]
}>()

const resolvedOwned = computed(() =>
  props.isOwned ?? (props.paint.status === 'owned' || props.paint.status === 'running_low' || props.paint.status === 'empty')
)

const resolvedWishlisted = computed(() =>
  props.isWishlisted ?? (props.paint.status === 'wishlist')
)

const brandColor = computed(() => getBrandColor(props.paint.brand))

function formatType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function handleCardClick() {
  navigateTo(`/paints/${props.paint._id}`)
}

function handleToggleOwned() {
  emit('toggleOwned', props.paint._id)
}

function handleToggleWishlist() {
  emit('toggleWishlist', props.paint._id)
}
</script>

<template>
  <div
    class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-gray-100 cursor-pointer h-14 hover:shadow-sm transition-shadow"
    @click="handleCardClick"
  >
    <ColorSwatch :color="paint.hexColor ?? '#cccccc'" size="sm" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 truncate">{{ paint.name }}</p>
      <p class="text-xs truncate">
        <span :style="{ color: brandColor }">{{ paint.brand }}</span>
        <span class="text-gray-400"> · {{ formatType(paint.paintType) }}</span>
      </p>
    </div>
    <div class="flex items-center gap-1 flex-shrink-0">
      <button
        class="w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
        :class="resolvedOwned ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-400'"
        aria-label="Toggle owned"
        @click.stop="handleToggleOwned"
      >
        <svg v-if="resolvedOwned" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </button>
      <button
        class="w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
        :class="resolvedWishlisted ? 'text-blue-500' : 'text-gray-300 hover:text-gray-400'"
        aria-label="Toggle wishlist"
        @click.stop="handleToggleWishlist"
      >
        <svg v-if="resolvedWishlisted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      </button>
    </div>
  </div>
</template>
