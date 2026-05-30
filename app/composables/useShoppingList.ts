import { api } from '../../convex/_generated/api'

export function useShoppingList() {
  const { data: items, isLoading, error } = useConvexQuery(api.paints.getShoppingList, {})
  return { items, isLoading, error }
}

export function useShoppingListSettings() {
  const { data: settings, isLoading, error } = useConvexQuery(api.paints.getUserShoppingSettings, {})
  const setPublic = useConvexMutation(api.paints.setShoppingListPublic)
  return { settings, isLoading, error, setPublic }
}
