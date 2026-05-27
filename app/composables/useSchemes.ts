import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

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
  }
}
