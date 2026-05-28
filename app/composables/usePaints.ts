import { api } from '../../convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '../../convex/_generated/dataModel'

interface PaintFilters {
  brand?: string
  paintType?: string
  status?: string
  q?: string
}

export function usePaints(filters?: Ref<PaintFilters>) {
  const queryArgs = computed(() => {
    const f = filters?.value
    return {
      brand: f?.brand || undefined,
      paintType: f?.paintType || undefined,
      status: f?.status || undefined,
      q: f?.q || undefined,
    }
  })

  const { data, isLoading } = useConvexQuery(api.paints.list, queryArgs)
  const addPaint = useConvexMutation(api.paints.create)
  const updatePaint = useConvexMutation(api.paints.update)
  const removePaint = useConvexMutation(api.paints.remove)

  return {
    paints: data,
    isLoading,
    addPaint,
    updatePaint,
    removePaint,
  }
}

export function usePaint(id: Id<'paints'>) {
  const { data, isLoading } = useConvexQuery(api.paints.get, { id })
  return { data, isLoading }
}

export function useCatalogPaint(id: Ref<Id<'catalogPaints'> | undefined>) {
  const client = useConvexClient()
  const data = ref<FunctionReturnType<typeof api.catalogSync.getCatalogPaint> | undefined>(undefined)
  const isLoading = ref(false)
  let unsubscribe: (() => void) | null = null

  watch(id, (newId) => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    if (!newId) {
      data.value = undefined
      isLoading.value = false
      return
    }
    isLoading.value = true
    unsubscribe = client.onUpdate(
      api.catalogSync.getCatalogPaint,
      { id: newId },
      (result) => {
        data.value = result
        isLoading.value = false
      },
      () => {
        isLoading.value = false
      },
    )
  }, { immediate: true })

  onScopeDispose(() => {
    if (unsubscribe) unsubscribe()
  })

  return { data, isLoading }
}
