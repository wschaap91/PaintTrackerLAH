# ADR-008: Custom Convex composables instead of official Vue bindings

- **Status:** Accepted
- **Date:** 2026-05-27
- **Deciders:** Wouter Schaap

---

## Context

Convex provides an official React SDK (`convex/react`) and a Vue SDK (`@convex-dev/vue`) for reactive query subscriptions. Alternatives:

- **`@convex-dev/vue`** — official Vue bindings, uses `useQuery` / `useMutation` pattern
- **Custom composables wrapping `ConvexClient`** — hand-rolled using the lower-level `ConvexClient` browser API
- **Raw `ConvexClient` in components** — no abstraction layer

## Decision

Use **custom composables** (`useConvexQuery`, `useConvexMutation`, `useConvexClient`) wrapping the low-level `ConvexClient` browser API directly.

```ts
// app/composables/useConvex.ts
export function useConvexQuery<Q extends FunctionReference<'query'>>(query: Q, ...args) {
  const client = useConvexClient()
  const data = ref<FunctionReturnType<Q> | undefined>(undefined)
  const isLoading = ref(true)
  // Uses client.onUpdate() for real-time subscriptions
  // Cleans up via onScopeDispose()
  return { data, isLoading, error }
}
```

## Rationale

- **Nuxt compatibility** — at the time of implementation, `@convex-dev/vue` had limited testing with Nuxt 4's `app/` directory convention and Nuxt's plugin system. The custom approach integrates cleanly via a Nuxt plugin.
- **Full control** — the custom composables follow Nuxt idioms (`useState`, `onScopeDispose`, `useNuxtApp`) exactly; there is no impedance mismatch between Vue SDK conventions and Nuxt conventions.
- **Typed** — `FunctionReference`, `FunctionReturnType`, and `OptionalRestArgsOrSkip` from `convex/server` provide the same type safety as the official SDK.
- **Simple surface area** — three functions cover all use cases: `useConvexClient()` for direct access, `useConvexQuery()` for reactive reads, `useConvexMutation()` for writes.

## Consequences

- **Not officially supported** — `ConvexClient` is a public API but the composable layer is ours to maintain. Breaking changes in Convex client internals require updating `useConvex.ts`.
- **Re-subscription on arg change** — `useConvexQuery` watches its args with `{ deep: true }` and re-subscribes on change. Be careful with object args that change identity on every render (use `computed` refs to stabilise).
- **No optimistic updates** — the custom mutation wrapper (`useConvexMutation`) is a thin pass-through; optimistic UI must be implemented manually per mutation if needed.
- **All data access via composables** — components must never call `$convex.query()` or `$convex.mutation()` directly; always use the typed composable wrappers.
