<script setup lang="ts">
const { items, isLoading, error } = useShoppingList()

const runningLow = computed(() => items.value?.filter(p => p.status === 'running_low') ?? [])
const empty = computed(() => items.value?.filter(p => p.status === 'empty') ?? [])
const wishlist = computed(() => items.value?.filter(p => p.status === 'wishlist') ?? [])

const totalCount = computed(() => (items.value?.length ?? 0))
const hasAny = computed(() => totalCount.value > 0)
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Shopping List</h1>
        <p class="mt-1 text-sm text-gray-500">
          <template v-if="!isLoading && hasAny">{{ totalCount }} paint{{ totalCount === 1 ? '' : 's' }} need attention</template>
          <template v-else-if="!isLoading">Your shopping list</template>
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12 text-sm text-gray-500">
      Loading...
    </div>

    <div v-else-if="error" class="mt-6 text-center py-12">
      <p class="text-sm text-red-600">Failed to load shopping list. Please try refreshing the page.</p>
    </div>

    <div v-else>
      <PaintShoppingShareToggle />

      <div v-if="!hasAny" class="mt-6">
        <EmptyState
          title="Nothing on your shopping list"
          description="Mark paints as Wishlist, Running Low, or Empty to see them here."
          action-label="Go to Paints"
          action-to="/paints"
        />
      </div>

      <div v-else class="mt-6 space-y-8">
        <!-- Running Low -->
        <section v-if="runningLow.length > 0">
          <h2 class="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">Running Low ({{ runningLow.length }})</h2>
          <div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            <NuxtLink
              v-for="paint in runningLow"
              :key="paint._id"
              :to="`/paints/${paint._id}`"
              class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <ColorSwatch :color="paint.hexColor" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ paint.name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ paint.brand }}<template v-if="paint.brandCode"> · {{ paint.brandCode }}</template></p>
              </div>
              <StatusBadge :status="paint.status" />
            </NuxtLink>
          </div>
        </section>

        <!-- Empty -->
        <section v-if="empty.length > 0">
          <h2 class="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3">Empty ({{ empty.length }})</h2>
          <div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            <NuxtLink
              v-for="paint in empty"
              :key="paint._id"
              :to="`/paints/${paint._id}`"
              class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <ColorSwatch :color="paint.hexColor" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ paint.name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ paint.brand }}<template v-if="paint.brandCode"> · {{ paint.brandCode }}</template></p>
              </div>
              <StatusBadge :status="paint.status" />
            </NuxtLink>
          </div>
        </section>

        <!-- Wishlist -->
        <section v-if="wishlist.length > 0">
          <h2 class="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">Wishlist ({{ wishlist.length }})</h2>
          <div class="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            <NuxtLink
              v-for="paint in wishlist"
              :key="paint._id"
              :to="`/paints/${paint._id}`"
              class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <ColorSwatch :color="paint.hexColor" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ paint.name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ paint.brand }}<template v-if="paint.brandCode"> · {{ paint.brandCode }}</template></p>
              </div>
              <StatusBadge :status="paint.status" />
            </NuxtLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
