import { api } from '../../convex/_generated/api'

export function useShoppingList() {
  const { data: items, isLoading } = useConvexQuery(api.paints.getShoppingList, {})
  return { items, isLoading }
}

export function useShoppingListSettings() {
  const { data: settings, isLoading } = useConvexQuery(api.paints.getUserShoppingSettings, {})
  const setPublic = useConvexMutation(api.paints.setShoppingListPublic)
  return { settings, isLoading, setPublic }
}
