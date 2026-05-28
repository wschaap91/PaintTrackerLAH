import { api } from '../../convex/_generated/api'
import type { Doc, Id } from '../../convex/_generated/dataModel'

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
  const data = ref<Doc<'catalogPaints'> | null | undefined>(undefined)
  const isLoading = ref(false)

  let unsubscribe: (() => void) | null = null
  let disposed = false

  watch(
    () => id.value,
    (newId) => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
      if (newId === undefined) {
        data.value = undefined
        isLoading.value = false
        return
      }
      if (disposed) return
      data.value = undefined
      isLoading.value = true
      unsubscribe = client.onUpdate(
        api.catalogSync.getCatalogPaint,
        { id: newId },
        (result) => {
          data.value = result
          isLoading.value = false
        },
        () => {
          data.value = undefined
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

  return { data, isLoading }
}
