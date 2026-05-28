import { api } from '../../convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'

export function useCatalogSearch() {
  const client = useConvexClient()
  const query = ref('')
  const results = ref<FunctionReturnType<typeof api.catalogSync.searchCatalog> | undefined>(undefined)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  let unsubscribe: (() => void) | null = null
  let disposed = false

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
      if (disposed) return
      results.value = undefined
      error.value = null
      isLoading.value = true
      unsubscribe = client.onUpdate(
        api.catalogSync.searchCatalog,
        { q: trimmed },
        (data) => {
          results.value = data
          isLoading.value = false
        },
        (err: Error) => {
          results.value = undefined
          error.value = err
          isLoading.value = false
        },
      )
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    disposed = true
    if (unsubscribe) unsubscribe()
  })

  return { query, results, isLoading, error }
}
