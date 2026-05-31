<script setup lang="ts">
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { PaintSearchFilters } from '~/components/paint/PaintSearchBar.vue'

// ---------------------------------------------------------------------------
// Tab state — default to 'owned'
// ---------------------------------------------------------------------------
const activeTab = ref<'all' | 'owned' | 'wishlist'>('owned')

// ---------------------------------------------------------------------------
// Shared search state
// ---------------------------------------------------------------------------
const searchFilters = ref<PaintSearchFilters>({
  q: '',
  brand: '',
  paintType: '',
})

// ---------------------------------------------------------------------------
// Data sources
// ---------------------------------------------------------------------------

// Catalog browse (All tab)
const catalog = useCatalogBrowse()

// All user paints (no server-side filter — we filter client-side for owned/wishlist)
const { paints: allPaints, isLoading: paintsLoading, updatePaint, removePaint } = usePaints()

// addFromCatalog mutation
const addFromCatalog = useConvexMutation(api.catalogSync.addFromCatalog)

// User's distinct brands (for Owned/Wishlist tab brand filter)
const { data: userBrands } = useConvexQuery(api.paints.listDistinctBrands, {})

// Auth (for sign out)
const { signOut } = useAuth()

// ---------------------------------------------------------------------------
// UI state
// ---------------------------------------------------------------------------
const showQuickAdd = ref(false)
const showImportExport = ref(false)

// ---------------------------------------------------------------------------
// Sync search query to catalog filters when on All tab
// ---------------------------------------------------------------------------
watch(
  () => searchFilters.value.q,
  (q) => {
    if (activeTab.value === 'all') {
      catalog.filters.q = q
    }
  },
)

watch(
  () => searchFilters.value.brand,
  (brand) => {
    if (activeTab.value === 'all') {
      catalog.filters.brand = brand
    }
  },
)

// When switching TO the All tab, sync current search state into catalog filters
watch(activeTab, (tab) => {
  if (tab === 'all') {
    catalog.filters.q = searchFilters.value.q
    catalog.filters.brand = searchFilters.value.brand
  }
})

// ---------------------------------------------------------------------------
// Client-side filtering for Owned / Wishlist tabs
// ---------------------------------------------------------------------------
function matchesSearch(paint: { name: string; brand: string }, q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  return paint.name.toLowerCase().includes(lower) || paint.brand.toLowerCase().includes(lower)
}

function matchesBrand(paint: { brand: string }, brand: string): boolean {
  if (!brand) return true
  return paint.brand === brand
}

const ownedPaints = computed(() => {
  const paints = allPaints.value ?? []
  return paints.filter(
    (p) =>
      (p.status === 'owned' || p.status === 'running_low' || p.status === 'empty') &&
      matchesSearch(p, searchFilters.value.q) &&
      matchesBrand(p, searchFilters.value.brand),
  )
})

const wishlistPaints = computed(() => {
  const paints = allPaints.value ?? []
  return paints.filter(
    (p) =>
      p.status === 'wishlist' &&
      matchesSearch(p, searchFilters.value.q) &&
      matchesBrand(p, searchFilters.value.brand),
  )
})

// ---------------------------------------------------------------------------
// Counts for tab pills
// ---------------------------------------------------------------------------
const ownedCount = computed(() => ownedPaints.value.length)
const wishlistCount = computed(() => wishlistPaints.value.length)

// ---------------------------------------------------------------------------
// Brand list per tab
// ---------------------------------------------------------------------------
const brandsForCurrentTab = computed(() => {
  if (activeTab.value === 'all') return catalog.availableBrands.value
  return userBrands.value ?? []
})

// ---------------------------------------------------------------------------
// Maps for determining owned/wishlisted state of catalog paints (All tab)
// ---------------------------------------------------------------------------
const catalogPaintStatusMap = computed(() => {
  const map = new Map<string, { paintId: string; status: string }>()
  const paints = allPaints.value ?? []
  for (const p of paints) {
    if (p.catalogPaintId) {
      map.set(p.catalogPaintId, { paintId: p._id, status: p.status ?? 'owned' })
    }
  }
  return map
})

function isCatalogPaintOwned(catalogPaintId: string): boolean {
  const entry = catalogPaintStatusMap.value.get(catalogPaintId)
  if (!entry) return false
  return entry.status === 'owned' || entry.status === 'running_low' || entry.status === 'empty'
}

function isCatalogPaintWishlisted(catalogPaintId: string): boolean {
  const entry = catalogPaintStatusMap.value.get(catalogPaintId)
  if (!entry) return false
  return entry.status === 'wishlist'
}

// ---------------------------------------------------------------------------
// Action handlers — All tab (catalog paints)
// ---------------------------------------------------------------------------
async function handleCatalogToggleOwned(catalogPaintId: string) {
  const entry = catalogPaintStatusMap.value.get(catalogPaintId)
  if (entry && (entry.status === 'owned' || entry.status === 'running_low' || entry.status === 'empty')) {
    // Already owned — remove it
    await removePaint({ id: entry.paintId as Id<'paints'> })
  } else if (entry && entry.status === 'wishlist') {
    // Currently wishlisted — change to owned
    await updatePaint({ id: entry.paintId as Id<'paints'>, status: 'owned' })
  } else {
    // Not in collection — add as owned
    await addFromCatalog({ catalogPaintId: catalogPaintId as Id<'catalogPaints'>, status: 'owned' })
  }
}

async function handleCatalogToggleWishlist(catalogPaintId: string) {
  const entry = catalogPaintStatusMap.value.get(catalogPaintId)
  if (entry && entry.status === 'wishlist') {
    // Already wishlisted — remove it
    await removePaint({ id: entry.paintId as Id<'paints'> })
  } else if (entry && (entry.status === 'owned' || entry.status === 'running_low' || entry.status === 'empty')) {
    // Currently owned — change to wishlist
    await updatePaint({ id: entry.paintId as Id<'paints'>, status: 'wishlist' })
  } else {
    // Not in collection — add as wishlist
    await addFromCatalog({ catalogPaintId: catalogPaintId as Id<'catalogPaints'>, status: 'wishlist' })
  }
}

// ---------------------------------------------------------------------------
// Action handlers — Owned / Wishlist tabs (user paints)
// ---------------------------------------------------------------------------
async function handleUserToggleOwned(paintId: string) {
  const paint = (allPaints.value ?? []).find((p) => p._id === paintId)
  if (!paint) return
  if (paint.status === 'owned' || paint.status === 'running_low' || paint.status === 'empty') {
    await removePaint({ id: paintId as Id<'paints'> })
  } else {
    await updatePaint({ id: paintId as Id<'paints'>, status: 'owned' })
  }
}

async function handleUserToggleWishlist(paintId: string) {
  const paint = (allPaints.value ?? []).find((p) => p._id === paintId)
  if (!paint) return
  if (paint.status === 'wishlist') {
    await removePaint({ id: paintId as Id<'paints'> })
  } else {
    await updatePaint({ id: paintId as Id<'paints'>, status: 'wishlist' })
  }
}

// ---------------------------------------------------------------------------
// IntersectionObserver for infinite scroll (All tab)
// ---------------------------------------------------------------------------
const sentinelRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

function setupObserver() {
  if (observer) {
    observer.disconnect()
  }
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (
        entry?.isIntersecting &&
        activeTab.value === 'all' &&
        catalog.hasMore.value &&
        !catalog.isLoading.value
      ) {
        catalog.loadMore()
      }
    },
    { rootMargin: '200px' },
  )
  if (sentinelRef.value) {
    observer.observe(sentinelRef.value)
  }
}

watch(sentinelRef, (el) => {
  if (el && observer) {
    observer.observe(el)
  }
})

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

// ---------------------------------------------------------------------------
// ThreeDotMenu handlers
// ---------------------------------------------------------------------------
function handleImportExport() {
  showImportExport.value = !showImportExport.value
}

async function handleLogout() {
  await signOut()
  await navigateTo('/auth/login')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">My Paints</h1>
      <div class="flex items-center gap-2">
        <!-- Desktop-only buttons -->
        <button
          class="hidden sm:inline-flex rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="showQuickAdd = true"
        >
          Quick Add
        </button>
        <button
          class="hidden sm:inline-flex rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="showImportExport = !showImportExport"
        >
          Import/Export
        </button>
        <!-- ThreeDotMenu (always visible) -->
        <ThreeDotMenu
          @import-export="handleImportExport"
          @logout="handleLogout"
        />
      </div>
    </div>

    <!-- Import/Export panel -->
    <div v-if="showImportExport" class="mb-4">
      <PaintImportExport :paints="allPaints ?? []" />
    </div>

    <!-- Search bar -->
    <div class="mb-3">
      <PaintSearchBar
        :model-value="searchFilters"
        :brands="brandsForCurrentTab"
        placeholder="Search paints..."
        @update:model-value="searchFilters = $event"
      />
    </div>

    <!-- Tab pills -->
    <div class="mb-4">
      <PaintTabPills
        v-model="activeTab"
        :owned-count="ownedCount"
        :wishlist-count="wishlistCount"
      />
    </div>

    <!-- All tab (catalog browse) -->
    <div v-if="activeTab === 'all'">
      <div v-if="catalog.isLoading.value && !catalog.results.value.length" class="text-center py-12 text-sm text-gray-500">
        Loading catalog...
      </div>

      <div v-else-if="!catalog.results.value.length">
        <EmptyState
          title="No paints found"
          :description="searchFilters.q || searchFilters.brand ? 'Try changing your search or filters.' : 'No catalog paints available.'"
        />
      </div>

      <div v-else class="flex flex-col gap-2">
        <PaintCardCompact
          v-for="paint in catalog.results.value"
          :key="paint._id"
          :paint="{
            _id: paint._id as string,
            name: paint.name,
            brand: paint.brand,
            hexColor: paint.hexColor ?? null,
            paintType: paint.paintType ?? 'base',
            catalogPaintId: paint._id as string,
          }"
          :is-owned="isCatalogPaintOwned(paint._id as string)"
          :is-wishlisted="isCatalogPaintWishlisted(paint._id as string)"
          @toggle-owned="handleCatalogToggleOwned(paint._id as string)"
          @toggle-wishlist="handleCatalogToggleWishlist(paint._id as string)"
        />
      </div>

      <!-- Infinite scroll sentinel -->
      <div
        v-if="catalog.hasMore.value"
        ref="sentinelRef"
        class="h-px"
      />

      <!-- Loading indicator for pagination -->
      <div v-if="catalog.isLoading.value && catalog.results.value.length" class="text-center py-4 text-sm text-gray-500">
        Loading more...
      </div>
    </div>

    <!-- Owned tab -->
    <div v-else-if="activeTab === 'owned'">
      <div v-if="paintsLoading" class="text-center py-12 text-sm text-gray-500">
        Loading...
      </div>

      <div v-else-if="!ownedPaints.length">
        <EmptyState
          title="No owned paints"
          :description="searchFilters.q || searchFilters.brand ? 'Try changing your search or filters.' : 'Add paints from the catalog to get started.'"
        />
      </div>

      <div v-else class="flex flex-col gap-2">
        <PaintCardCompact
          v-for="paint in ownedPaints"
          :key="paint._id"
          :paint="{
            _id: paint._id as string,
            name: paint.name,
            brand: paint.brand,
            hexColor: paint.hexColor ?? null,
            paintType: paint.paintType,
            status: paint.status,
            catalogPaintId: paint.catalogPaintId as string | undefined,
          }"
          @toggle-owned="handleUserToggleOwned"
          @toggle-wishlist="handleUserToggleWishlist"
        />
      </div>
    </div>

    <!-- Wishlist tab -->
    <div v-else-if="activeTab === 'wishlist'">
      <div v-if="paintsLoading" class="text-center py-12 text-sm text-gray-500">
        Loading...
      </div>

      <div v-else-if="!wishlistPaints.length">
        <EmptyState
          title="No wishlisted paints"
          :description="searchFilters.q || searchFilters.brand ? 'Try changing your search or filters.' : 'Browse the catalog and heart paints you want.'"
        />
      </div>

      <div v-else class="flex flex-col gap-2">
        <PaintCardCompact
          v-for="paint in wishlistPaints"
          :key="paint._id"
          :paint="{
            _id: paint._id as string,
            name: paint.name,
            brand: paint.brand,
            hexColor: paint.hexColor ?? null,
            paintType: paint.paintType,
            status: paint.status,
            catalogPaintId: paint.catalogPaintId as string | undefined,
          }"
          @toggle-owned="handleUserToggleOwned"
          @toggle-wishlist="handleUserToggleWishlist"
        />
      </div>
    </div>

    <!-- Quick Add modal -->
    <PaintQuickAdd
      v-if="showQuickAdd"
      @close="showQuickAdd = false"
    />
  </div>
</template>
