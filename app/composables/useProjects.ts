import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export function useProjects() {
  const { data, isLoading } = useConvexQuery(api.projects.list)
  return { data, isLoading }
}

export function useProject(id: Id<'projects'>) {
  const { data, isLoading } = useConvexQuery(api.projects.get, { id })
  return { data, isLoading }
}

export function useProjectMutations() {
  return {
    create: useConvexMutation(api.projects.create),
    update: useConvexMutation(api.projects.update),
    remove: useConvexMutation(api.projects.remove),
  }
}
