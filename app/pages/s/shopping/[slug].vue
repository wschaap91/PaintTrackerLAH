<script setup lang="ts">
import { api } from '../../../../convex/_generated/api'

definePageMeta({ layout: false })

const route = useRoute()
const slug = route.params.slug as string

const client = useConvexClient()

type ShoppingItem = {
  _id: string
  status: string
  brand: string
  name: string
  hexColor?: string
  brandCode?: string
  paintType?: string
}

type ShoppingListResult =
  | null
  | { private: true }
  | { items: ShoppingItem[] }

const shoppingList = ref<ShoppingItem[] | null>(null)
const isLoading = ref(true)
const notFound = ref(false)
const loadError = ref(false)

onMounted(async () => {
  try {
    const result = await client.query(api.paints.getPublicShoppingList, { slug }) as ShoppingListResult
    if (!result || 'private' in result) {
      notFound.value = true
    }
    else {
      shoppingList.value = result.items
    }
  }
  catch (err) {
    console.error('[s/shopping/[slug].vue] Failed to load public shopping list:', err)
    loadError.value = true
  }
  finally {
    isLoading.value = false
  }
})

useHead({ title: 'Shopping List — PaintTracker' })

const STATUS_ORDER = ['running_low', 'empty', 'wishlist'] as const
type StatusKey = typeof STATUS_ORDER[number]

const STATUS_LABEL: Record<StatusKey, string> = {
  running_low: 'Running Low',
  empty: 'Empty',
  wishlist: 'Wishlist',
}

const STATUS_BADGE_CLASS: Record<StatusKey, string> = {
  running_low: 'bg-yellow-100 text-yellow-800',
  empty: 'bg-red-100 text-red-800',
  wishlist: 'bg-blue-100 text-blue-800',
}

const groupedItems = computed(() => {
  if (!shoppingList.value) return []
  return STATUS_ORDER
    .map(status => ({
      status,
      label: STATUS_LABEL[status],
      items: shoppingList.value!.filter(i => i.status === status),
    }))
    .filter(g => g.items.length > 0)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <NuxtLink to="/" class="text-lg font-semibold text-gray-900">PaintTracker</NuxtLink>
        <NuxtLink to="/auth/login" class="text-sm text-gray-500 hover:text-gray-700">Sign in</NuxtLink>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 py-8">
      <div v-if="isLoading" class="text-center py-16 text-gray-400">Loading…</div>

      <div v-else-if="notFound" class="text-center py-16">
        <p class="text-gray-500">This shopping list is not available.</p>
        <NuxtLink to="/" class="mt-4 inline-block text-sm text-gray-700 hover:underline">Go to PaintTracker</NuxtLink>
      </div>

      <div v-else-if="loadError" class="text-center py-16">
        <p class="text-gray-500">Something went wrong loading this shopping list.</p>
        <button
          @click="$router.go(0)"
          class="mt-4 inline-block text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          Try again
        </button>
      </div>

      <div v-else-if="shoppingList !== null">
        <h1 class="text-2xl font-semibold text-gray-900 mb-6">Shopping List</h1>

        <p v-if="groupedItems.length === 0" class="text-center py-8 text-gray-400 text-sm">
          This shopping list is empty.
        </p>

        <div v-else class="space-y-8">
          <section v-for="group in groupedItems" :key="group.status">
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {{ group.label }}
            </h2>
            <div class="space-y-2">
              <div
                v-for="item in group.items"
                :key="item._id"
                class="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
              >
                <div
                  class="w-8 h-8 rounded-full border border-gray-200 flex-shrink-0"
                  :style="{ backgroundColor: item.hexColor ?? '#e5e7eb' }"
                />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900">{{ item.brand }} — {{ item.name }}</p>
                  <p v-if="item.brandCode" class="text-xs text-gray-400">{{ item.brandCode }}</p>
                </div>
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                  :class="STATUS_BADGE_CLASS[item.status as StatusKey]"
                >
                  {{ STATUS_LABEL[item.status as StatusKey] ?? item.status }}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>
