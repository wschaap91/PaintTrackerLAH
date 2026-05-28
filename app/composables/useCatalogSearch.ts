import type { FunctionReturnType } from 'convex/server'
import { api } from '../../convex/_generated/api'

export function useCatalogSearch() {
  const client = useConvexClient()

  const query = ref('')
  const results = ref<FunctionReturnType<typeof api.catalogSync.searchCatalog> | undefined>(undefined)
  const isLoading = ref(false)

  const trimmedQuery = computed(() => query.value.trim())

  let unsubscribe: (() => void) | null = null

  watch(trimmedQuery, (q) => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    if (q.length < 2) {
      results.value = undefined
      isLoading.value = false
      return
    }

    isLoading.value = true
    unsubscribe = client.onUpdate(
      api.catalogSync.searchCatalog,
      { q },
      (result) => {
        results.value = result
        isLoading.value = false
      },
      () => {
        isLoading.value = false
      },
    )
  })

  onScopeDispose(() => {
    if (unsubscribe) unsubscribe()
  })

  return { query, results, isLoading }
}
