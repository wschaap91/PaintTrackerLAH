import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export interface AreaPayload { name: string; sortOrder: number }
export interface StepPayload { paintId: Id<'paints'> | null; technique: string; notes: string | null; areaIndex?: number | null }
export interface SchemeArea { _id: string; name: string; sortOrder: number }
export interface SchemeStep { _id: string; paintId: string | null; technique: string; notes: string | null; areaId: string | null; paint?: { name: string; brand: string; hexColor: string } | null }

export function useSchemes() {
  const { data, isLoading } = useConvexQuery(api.schemes.list)
  return { data, isLoading }
}

export function useScheme(id: Id<'schemes'>) {
  const { data, isLoading } = useConvexQuery(api.schemes.get, { id })
  return { data, isLoading }
}

export function useSchemeMutations() {
  return {
    create: useConvexMutation(api.schemes.create),
    update: useConvexMutation(api.schemes.update),
    remove: useConvexMutation(api.schemes.remove),
    setPublic: useConvexMutation(api.schemes.setPublic),
  }
}
