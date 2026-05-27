---
version: 3
status: draft
date: 2026-05-27
author: Wouter Schaap
previous: prd-v2.md
---

# PaintTrackerLAH — Hardening: Router Guards, Error Handling & API Security

## 1. Problem

Three categories of bugs survived the previous cycle and made it to production:

**Auth session breaks on navigation.** After logging in, navigating to any protected page immediately redirects back to `/auth/login`. The global route middleware reads `localStorage` directly to check auth status, but the Convex client validates the token asynchronously and may clear `localStorage` before the middleware runs. This creates a race condition where `isAuthenticated` is `true` in the composable but the middleware sees an empty token and bounces the user.

**Silent failures leave the UI broken.** Four async operations have no error handling: `discover.vue`'s `load()` function, the `onMounted` handler in the public scheme page, and `togglePublic()` and `copyLink()` in the scheme detail page. When any of these fail, loading spinners freeze, actions appear to do nothing, and the user has no feedback. An `error` ref exists on the scheme detail page and goes entirely unused.

**The public API leaks internal data.** `getPublicScheme` — the query used for public share URLs — returns full scheme and paint documents to unauthenticated callers. This includes `userId`, `barcode`, and `notes` fields that anonymous users have no business seeing.

## 2. Solution

A focused hardening pass across the auth layer, four page components, and one Convex query. No new features, no schema changes, no new pages. The auth fix makes the middleware use the reactive `isAuthenticated` state as the source of truth instead of reading `localStorage` directly, and keeps the Convex invalidation callback in sync with that state. The error handling changes wrap each async operation in try/catch/finally with meaningful UI feedback. The API fix projects only the fields that public callers need.

## 3. Scope

| This PRD covers | This PRD does NOT cover |
|---|---|
| Router guard race condition fix | New auth providers or auth flows |
| Error handling in `discover.vue` | Retry logic or offline support |
| Error handling in `s/[slug].vue` | Component redesign or UX changes |
| Error handling in `schemes/[id].vue` (toggle + copy) | New scheme or paint features |
| `getPublicScheme` data projection | Other Convex queries |
| Moving the dynamic `api` import in `s/[slug].vue` to module scope | ESLint config or linting setup |
| | Atomic design, Storybook, Vitest, Playwright |

## 4. Architecture

### File structure

```
app/
  plugins/
    convex.client.ts        ← updated: invalidation callback syncs useState
  middleware/
    auth.global.ts          ← updated: reads useState instead of localStorage
  pages/
    discover.vue            ← updated: try/catch/finally in load()
    s/[slug].vue            ← updated: try/catch/finally + move api import
    schemes/[id].vue        ← updated: try/catch in togglePublic + copyLink
convex/
  schemes.ts                ← updated: project only public fields in getPublicScheme
```

No new files. All changes are modifications to existing files.

### Key components

**`convex.client.ts` (Nuxt plugin)**
Owns the `ConvexClient` instance and the `setAuth`/`clearAuth` lifecycle. Currently the token invalidation callback only removes the token from `localStorage`. It needs to also update the shared `useState('auth:isAuthenticated')` to `false`, so that reactive state and `localStorage` never diverge.

**`auth.global.ts` (route middleware)**
Runs before every navigation. Currently reads `localStorage.getItem('convex_auth_token')`. Needs to read `useState('auth:isAuthenticated')` instead — the reactive state that is set to `true` by `signIn()` and will be set to `false` by the updated invalidation callback. `localStorage` becomes an implementation detail of the plugin, not the contract the middleware guards on.

**`discover.vue`**
The `load()` function fetches public schemes via a one-shot `client.query()`. Needs a `try/catch/finally`: finally resets `isLoading`, catch surfaces an `error` message to the template.

**`s/[slug].vue`**
The `onMounted` handler fetches a public scheme by slug. The `api` import currently happens inside `onMounted` (dynamic import on every mount). Move it to module scope. Wrap the fetch in `try/catch/finally`: finally resets `isLoading`, catch sets `notFound = true` so the "not found" state is shown rather than a frozen spinner.

**`schemes/[id].vue`**
Two functions need hardening:
- `togglePublic()`: add try/catch that writes to the existing (unused) `error` ref. Add an `isTogglingPublic` boolean to disable the button while the mutation is in-flight, preventing double-clicks.
- `copyLink()`: wrap `navigator.clipboard.writeText()` in try/catch. On failure, set a short-lived `copyFailed` message in addition to the existing `copied` state.

**`convex/schemes.ts` — `getPublicScheme`**
Returns a public scheme document to unauthenticated callers. Project fields explicitly on both the scheme and each paint embedded in the steps:
- Scheme: `_id`, `name`, `description`, `slug`, `isPublic`, `_creationTime`, `authorName`
- Per-step paint: `name`, `brand`, `hexColor`

Strip `userId`, `barcode`, `notes`, and any other internal fields before returning.

### Data flow

**Auth guard (fixed):**
```
User navigates
  → auth.global.ts middleware fires
  → reads useState('auth:isAuthenticated')   [was: localStorage]
  → if false → redirect to /auth/login
  → if true  → allow

Convex token invalidated (async)
  → convex.client.ts invalidation callback fires
  → localStorage.removeItem('convex_auth_token')   [existing]
  → useState('auth:isAuthenticated').value = false  [new]
  → next navigation → middleware reads false → redirect to login  ✓
```

**Error handling pattern (all four locations):**
```
async operation starts → isLoading = true
  → try: execute Convex query/mutation
      → success: update UI state
  → catch: set error ref / notFound / copyFailed
  → finally: isLoading = false
```

**Public API projection:**
```
Anonymous caller → getPublicScheme({ slug })
  → DB lookup by slug index
  → if not found or not public → return null
  → project scheme fields (whitelist)
  → for each step: project paint fields (whitelist)
  → return safe document
```

### Integration points

| Touch point | What changes |
|---|---|
| `useState('auth:isAuthenticated')` key | Read in plugin invalidation callback (new); read in middleware (replaces localStorage) |
| `convex/schemes.ts` `getPublicScheme` | Return shape changes — `s/[slug].vue` must only reference fields in the new projection |
| `schemes/[id].vue` `error` ref | Already declared, now actually written to |

## 5. Success Metrics

| Metric | Target |
|---|---|
| Login → navigate to protected page | No redirect to `/auth/login` |
| `load()` network error in discover | `isLoading` resets; error message shown |
| `onMounted` error in `s/[slug].vue` | Spinner clears; not-found or error state shown |
| `togglePublic()` mutation error | `error` ref populated; shown in template |
| `copyLink()` clipboard failure | Fallback message shown |
| `getPublicScheme` response fields | No `userId`, `barcode`, or `notes` in response |

## 6. Out of Scope

- Token refresh / expiry handling (Convex manages this)
- Retry logic on network failures
- New page layouts or component redesign
- ESLint configuration or linting rule changes
- Atomic design system, Storybook, Vitest, Playwright (PRD v4)
- Any new features, queries, or mutations beyond the ones listed

---

### Dependencies & Risks

| Dependency/Risk | Impact | Mitigation |
|---|---|---|
| `s/[slug].vue` consumes fields from `getPublicScheme` | If the projection removes a field the page template references, it will silently render as `undefined` | Audit all field accesses in `s/[slug].vue` against the new projection before shipping |
| `navigator.clipboard` requires HTTPS or localhost | `copyLink()` catch is now handled, but the fix must not swallow the error silently | Catch must surface a user-visible message, not just `console.error` |
| `useState` key must match between plugin and middleware | Typo in the key name would break auth for all users | Use a shared constant or verify the key string matches exactly |

### Privacy & Security

The `getPublicScheme` change is the only security-relevant change. It is additive-safe: the new projection is a strict subset of what was previously returned. Callers that worked before will continue to work. No migration or backfill needed.

Internal fields — `userId`, `barcode`, `notes` — are not required by the public share page (`s/[slug].vue`) and have no business being visible to anonymous callers.
