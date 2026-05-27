import type { FunctionReference, FunctionReturnType, OptionalRestArgsOrSkip } from 'convex/server'

export function useConvexClient() {
  const { $convex } = useNuxtApp()
  if (!$convex) {
    throw new Error('Convex client not available')
  }
  return $convex
}

export function useConvexQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  ...args: OptionalRestArgsOrSkip<Query>
) {
  const client = useConvexClient()
  const data = ref<FunctionReturnType<Query> | undefined>(undefined)
  const isLoading = ref(true)
  const error = ref<Error | null>(null)

  const queryArgs = args[0] ?? {}
  let unsubscribe: (() => void) | null = null

  function subscribe(actualArgs: Record<string, unknown>) {
    if (unsubscribe) unsubscribe()
    unsubscribe = client.onUpdate(
      query,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      actualArgs as any,
      (result) => {
        data.value = result
        isLoading.value = false
        error.value = null
      },
      (err) => {
        error.value = err instanceof Error ? err : new Error(String(err))
        isLoading.value = false
      },
    )
  }

  if (isRef(queryArgs) || (queryArgs && typeof queryArgs === 'object')) {
    watch(
      () => (isRef(queryArgs) ? queryArgs.value : queryArgs),
      (newArgs) => {
        subscribe(newArgs as Record<string, unknown>)
      },
      { immediate: true, deep: true },
    )
  }
  else {
    subscribe({})
  }

  onScopeDispose(() => {
    if (unsubscribe) unsubscribe()
  })

  return { data, isLoading, error }
}

export function useConvexMutation<M extends FunctionReference<'mutation'>>(mutation: M) {
  const client = useConvexClient()
  return (args: M['_args']) => client.mutation(mutation, args)
}
