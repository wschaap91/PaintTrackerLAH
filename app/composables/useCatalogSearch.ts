import { api } from '../../convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'

export function useCatalogSearch() {
  const client = useConvexClient()
  const query = ref('')
  const results = ref<FunctionReturnType<typeof api.catalogSync.searchCatalog> | undefined>(undefined)
  const isLoading = ref(false)

  let unsubscribe: (() => void) | null = null

  watch(
    () => query.value.trim(),
    (trimmed) => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      if (trimmed.length < 2) {
        results.value = undefined
        isLoading.value = false
        return
      }
      isLoading.value = true
      unsubscribe = client.onUpdate(
        api.catalogSync.searchCatalog,
        { q: trimmed },
        (data) => {
          results.value = data
          isLoading.value = false
        },
        () => {
          isLoading.value = false
        },
      )
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    if (unsubscribe) unsubscribe()
  })

  return { query, results, isLoading }
}
