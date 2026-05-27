import { api } from '../../convex/_generated/api'
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
