import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'
import type { PaginationResult } from 'convex/server'

export type CatalogPaint = Doc<'catalogPaints'>

const PAGE_SIZE = 25
const SEARCH_FETCH_SIZE = 100

export function useCatalogBrowse() {
  const client = useConvexClient()

  // ---------------------------------------------------------------------------
  // Filter state
  // ---------------------------------------------------------------------------
  const filters = reactive({
    brand: '',
    range: '',
    colorFamily: '',
    q: '',
    hideOwned: false,
  })

  // ---------------------------------------------------------------------------
  // Output state
  // ---------------------------------------------------------------------------
  const results = ref<CatalogPaint[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const hasMore = ref(false)
  const ownedIds = ref<Set<string>>(new Set())
  const availableRanges = ref<string[]>([])

  // ---------------------------------------------------------------------------
  // Internal cursor / subscription tracking
  // ---------------------------------------------------------------------------
  let continueCursor: string | null = null
  let pageUnsubs: Array<() => void> = []
  let ownedUnsub: (() => void) | null = null
  let rangesUnsub: (() => void) | null = null
  let disposed = false

  // Search mode chunking state
  const allSearchResults = ref<CatalogPaint[]>([])
  const searchChunkIndex = ref(0)

  // Debounce timer for text query
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // ---------------------------------------------------------------------------
  // Owned IDs subscription (always active)
  // ---------------------------------------------------------------------------
  function subscribeOwnedIds() {
    if (ownedUnsub) {
      ownedUnsub()
      ownedUnsub = null
    }
    if (disposed) return
    ownedUnsub = client.onUpdate(
      api.paints.listOwnedCatalogIds,
      {},
      (data: Id<'catalogPaints'>[]) => {
        ownedIds.value = new Set(data as string[])
      },
      (_err: Error) => {
        // Non-fatal: keep previous ownedIds
      },
    )
  }

  // ---------------------------------------------------------------------------
  // Ranges subscription — re-subscribes when brand filter changes
  // ---------------------------------------------------------------------------
  function subscribeRanges() {
    if (rangesUnsub) {
      rangesUnsub()
      rangesUnsub = null
    }
    if (disposed) return
    const brand = filters.brand || undefined
    rangesUnsub = client.onUpdate(
      api.catalogSync.listCatalogRanges,
      { brand },
      (data: string[]) => {
        availableRanges.value = data
      },
      (_err: Error) => {
        // Non-fatal: keep previous ranges
      },
    )
  }

  // ---------------------------------------------------------------------------
  // Reset helpers
  // ---------------------------------------------------------------------------
  function resetPagination() {
    pageUnsubs.forEach(u => u())
    pageUnsubs = []
    continueCursor = null
    results.value = []
    hasMore.value = false
    allSearchResults.value = []
    searchChunkIndex.value = 0
  }

  // ---------------------------------------------------------------------------
  // Browse mode: subscribe to a single page by cursor
  // ---------------------------------------------------------------------------
  function subscribeBrowsePage(cursor: string | null, append: boolean) {
    if (disposed) return
    if (!append) {
      resetPagination()
    } else {
      // Cancel existing page subscriptions so stale callbacks can't overwrite
      // isLoading/error state from this newer subscription. We intentionally
      // keep results.value intact — it holds the accumulated previous pages.
      pageUnsubs.forEach(u => u())
      pageUnsubs = []
    }
    isLoading.value = true
    error.value = null

    const brand = filters.brand || undefined
    const range = filters.range || undefined
    const colorFamily = filters.colorFamily || undefined

    const unsub = client.onUpdate(
      api.catalogSync.browseCatalog,
      {
        brand,
        range,
        colorFamily,
        paginationOpts: { numItems: PAGE_SIZE, cursor },
      },
      (data: PaginationResult<CatalogPaint>) => {
        if (!append) {
          results.value = data.page
        } else {
          results.value = [...results.value, ...data.page]
        }
        continueCursor = data.isDone ? null : data.continueCursor
        hasMore.value = !data.isDone
        isLoading.value = false
      },
      (err: Error) => {
        error.value = err
        isLoading.value = false
        if (append) {
          hasMore.value = false
        }
      },
    )
    pageUnsubs.push(unsub)
  }

  // ---------------------------------------------------------------------------
  // Search mode subscription
  // ---------------------------------------------------------------------------
  let searchUnsub: (() => void) | null = null

  function subscribeSearch(q: string) {
    if (searchUnsub) {
      searchUnsub()
      searchUnsub = null
    }
    resetPagination()
    if (disposed) return

    isLoading.value = true
    error.value = null

    const brand = filters.brand || undefined
    const colorFamily = filters.colorFamily || undefined

    searchUnsub = client.onUpdate(
      api.catalogSync.searchCatalog,
      {
        q,
        brand,
        colorFamily,
        limit: SEARCH_FETCH_SIZE,
      },
      (data: CatalogPaint[]) => {
        allSearchResults.value = data
        // Re-slice to current chunk index (subscription may push updated data)
        const revealedCount = (searchChunkIndex.value + 1) * PAGE_SIZE
        results.value = data.slice(0, revealedCount)
        hasMore.value = data.length > revealedCount
        isLoading.value = false
      },
      (err: Error) => {
        error.value = err
        isLoading.value = false
      },
    )
  }

  function teardownSearch() {
    if (searchUnsub) {
      searchUnsub()
      searchUnsub = null
    }
  }

  // ---------------------------------------------------------------------------
  // Mode switching logic
  // ---------------------------------------------------------------------------
  function isSearchMode() {
    return filters.q.trim().length >= 2
  }

  function refresh() {
    if (isSearchMode()) {
      teardownSearch()
      subscribeSearch(filters.q.trim())
    } else {
      teardownSearch()
      subscribeBrowsePage(null, false)
    }
  }

  // ---------------------------------------------------------------------------
  // loadMore — search mode: reveal next chunk; browse mode: fetch next page
  // ---------------------------------------------------------------------------
  function loadMore() {
    if (isSearchMode()) {
      if (!hasMore.value) return
      searchChunkIndex.value++
      const revealedCount = (searchChunkIndex.value + 1) * PAGE_SIZE
      results.value = allSearchResults.value.slice(0, revealedCount)
      hasMore.value = allSearchResults.value.length > revealedCount
      return
    }
    if (!hasMore.value || continueCursor === null) return
    subscribeBrowsePage(continueCursor, true)
  }

  // ---------------------------------------------------------------------------
  // Computed results — apply hideOwned client-side
  // ---------------------------------------------------------------------------
  const filteredResults = computed<CatalogPaint[]>(() => {
    if (!filters.hideOwned) return results.value
    return results.value.filter(p => !ownedIds.value.has(p._id as string))
  })

  // ---------------------------------------------------------------------------
  // Watchers
  // ---------------------------------------------------------------------------

  // Watch non-text filters (brand, range, colorFamily, hideOwned)
  watch(
    () => [filters.brand, filters.range, filters.colorFamily] as const,
    ([newBrand], [oldBrand]) => {
      // If brand changes, reset range and refresh ranges subscription
      if (newBrand !== oldBrand) {
        filters.range = ''
        subscribeRanges()
      }
      refresh()
    },
  )

  // Watch text query with debounce
  watch(
    () => filters.q,
    () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        refresh()
      }, 300)
    },
  )

  // Initial load
  subscribeOwnedIds()
  subscribeRanges()
  isLoading.value = true
  subscribeBrowsePage(null, false)

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------
  onScopeDispose(() => {
    disposed = true
    if (debounceTimer) clearTimeout(debounceTimer)
    pageUnsubs.forEach(u => u())
    pageUnsubs = []
    teardownSearch()
    if (ownedUnsub) ownedUnsub()
    if (rangesUnsub) rangesUnsub()
  })

  return {
    filters,
    results: filteredResults,
    isLoading,
    error,
    ownedIds,
    loadMore,
    hasMore,
    availableRanges,
  }
}
