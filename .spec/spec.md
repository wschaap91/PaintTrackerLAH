# PaintTrackerLAH — Spec

Last updated: 2026-05-29 (after PR #74 — infinite scroll for catalog browse and search)

## Architecture

Nuxt 4 SPA frontend communicates with Convex Cloud exclusively through a single `ConvexClient` instance (initialised in `convex.client.ts`). All data access is mediated by custom composables — no component touches the Convex API directly. Auth tokens (JWT + refresh token) live in `localStorage` and are re-hydrated on every page load via in-memory variables. A global route middleware blocks unauthenticated users from all routes except `/auth/**`, `/s/**`, and `/discover`.

- Frontend → Convex Cloud via ConvexClient (WebSocket + HTTP)
- Auth → @convex-dev/auth Password provider; JWT + refresh token stored in localStorage (ADR-004)
- Token refresh: `fetchToken({ forceRefreshToken })` callback exchanges refresh token for a fresh JWT ~10s before expiry, enabling sessions up to 30 days
- Public routes: `/s/[slug]`, `/discover`, `/auth/*` — no token required

## Stack

- **Nuxt 4** `^4.4.6` — SPA mode (`ssr: false`) (ADR-001)
- **Convex** `^1.39.1` + **@convex-dev/auth** `^0.0.92` — backend, DB, auth (ADR-002, ADR-003)
- **Vue 3** `^3.5.34` + **vue-router** `^5.0.7`
- **@nuxtjs/tailwindcss** `^6.14.0` — custom `accent` color palette (ADR-005)
- **nanoid** `^5.1.11` — slug generation for public scheme sharing (ADR-007)
- **vuedraggable** `^4.1.0` — drag-to-reorder scheme steps
- **html5-qrcode** `^2.3.8` — barcode scanning for paint lookup
- **zod** `^4.4.3` — runtime validation
- **Vercel** (nuxtjs adapter) — frontend host (ADR-006)

## Data Model

```ts
// paints — user-owned paint inventory
{ userId: string, name: string, brand: string, hexColor: string,
  paintType?: string, status?: string, barcode?: string,
  notes?: string, quantity?: number, catalogPaintId?: Id<"catalogPaints"> }
// indexes: by_user, by_brand, by_barcode

// schemes — painting recipes
{ userId: string, name: string, description?: string,
  isPublic: boolean, slug?: string, authorName?: string }
// indexes: by_user, by_slug, by_public

// schemeSteps — ordered steps within a scheme
{ schemeId: Id<"schemes">, paintId: Id<"paints">,
  stepOrder: number, label?: string, notes?: string }
// indexes: by_scheme

// projects — painting projects
{ userId: string, name: string, description?: string, status?: string }
// indexes: by_user

// projectSchemes — join: project ↔ scheme
{ projectId: Id<"projects">, schemeId: Id<"schemes"> }
// indexes: by_project

// projectPaints — join: project ↔ paint with usage tracking
{ projectId: Id<"projects">, paintId: Id<"paints">,
  quantityNeeded?: number, quantityUsed?: number }
// indexes: by_project

// catalogPaints — read-only paint catalog (synced from OpenMiniPaints API)
{ brand: string, range: string, rangeCode: string, name: string,
  brandCode: string, hexColor: string | null, paintType: string,
  finish: string | null, transparency: string | null,
  colorFamily?: string,
  specialType?: string | null, barcode?: string | null,
  openMiniPaintsId?: string, syncedAt?: number }
// indexes: by_brand, by_range, by_brand_code, by_open_mini_paints_id, by_brand_range, by_color_family
// searchIndex: search_name (searchField: name, filterFields: [brand, range, colorFamily])
```

Auth tables provided by `@convex-dev/auth` (ADR-003).

## API Surface

**paints.ts** (all authenticated)
- `list({})` → `Paint[]`
- `get({ id })` → `Paint | null`
- `create({ name, brand, hexColor, paintType?, status?, barcode?, notes?, quantity?, catalogPaintId? })` → `Id<"paints">`
- `update({ id, ...fields })` → `void`
- `remove({ id })` → `void`
- `bulkCreate({ paints[], onDuplicate: 'skip' | 'update' })` → `{ added, skipped, updated }` — dedupes by name+brand; each paint accepts `catalogPaintId?`
- `search({ query })` → `Paint[]`
- `listOwnedCatalogIds({})` → `Id<"catalogPaints">[]` — returns catalog paint IDs the user already owns

**schemes.ts** (authenticated unless noted)
- `list({})`, `get({ id })`, `create(...)`, `update(...)`, `remove({ id })`
- `addStep / removeStep / updateStep / reorderSteps`
- `setPublic({ schemeId, isPublic })` — generates nanoid slug on first publish
- `getPublicScheme({ slug })` → projected safe fields — **NO AUTH**
- `listPublicSchemes({})` → public schemes — **NO AUTH**

**projects.ts** (all authenticated)
- `list({})`, `get({ id })`, `create(...)`, `update(...)`, `remove({ id })`
- `addScheme / removeScheme`, `addPaint / removePaint / updatePaint`

**catalogSync.ts** (authenticated unless noted)
- `searchCatalog({ q, brand?, range?, colorFamily?, limit? })` → `CatalogPaint[]` — auth required; uses `search_name` searchIndex with optional `range` and `colorFamily` filters; limit clamped 1–100 (default 10)
- `browseCatalog({ brand?, range?, colorFamily?, paginationOpts })` → paginated `CatalogPaint[]` — auth required; uses `by_brand_range` index; filters by `colorFamily` post-index
- `getCatalogPaint({ id })` → `CatalogPaint | null` — auth required
- `lookupCatalogByCode({ code?, barcode? })` → `CatalogPaint | null` — auth required; `code` uses `by_brand_code` index (exact match); `barcode` uses filter scan
- `addFromCatalog({ catalogPaintId })` → `Id<"paints">` — auth required; creates owned paint from catalog entry; throws if user already owns a paint with same `catalogPaintId`
- `listCatalogRanges({ brand? })` → `string[]` — auth required; returns distinct range values from `catalogPaints`, optionally filtered by brand using `by_brand_range` index
- `internal.upsertCatalogPaint(...)` — internalMutation; upserts by `openMiniPaintsId`, fallback brand+brandCode for pre-sync rows; always sets `syncedAt`; computes and stores `colorFamily` via `classifyColorFamily`
- `internal.syncCatalog({})` — internalAction; cursor-paged HTTP fetch from OpenMiniPaints API; scheduled nightly via `crons.ts`; returns `{ synced, errors }`
- `internal.backfillColorFamily({})` — internalAction; paginates all `catalogPaints` rows and calls `backfillColorFamilyBatch` to fill missing `colorFamily` values
- `internal.backfillColorFamilyBatch({ cursor })` — internalMutation; processes up to 100 rows per call via cursor-based pagination, writes `colorFamily` for rows missing it

**migrations.ts** (all internal)
- `internal.normalizeArmyPainterNames({})` — internalAction; drives paginated cleanup of Army Painter `catalogPaints` rows; uses `by_brand` index and cursor-based pagination (same pattern as `backfillColorFamily`)
- `internal.normalizeArmyPainterNamesBatch({ cursor })` — internalMutation; processes up to 100 rows/batch; strips range prefixes from names, backfills correct `range` and `paintType` via `classifyArmyPainterRow`; idempotent

**http.ts** — HTTP action routes for Convex Auth callbacks

## Key Patterns

- **Composable-only data access**: `useConvexQuery`, `useConvexMutation`, `useConvexClient` wrap all Convex calls (ADR-008); `useCatalogSearch`, `useCatalogPaint`, and `useCatalogBrowse` use `client.onUpdate` directly for real-time subscriptions with explicit lifecycle management (immediate watch, disposed guard via `onScopeDispose`, stale `data` cleared on unsubscribe or error, `error` ref exposed to callers)
- **Domain composables**: `usePaints`, `useSchemes`, `useProjects`, `useImportExport`
- **`useCatalogBrowse`**: reactive catalog browsing composable; auto-switches between `browseCatalog` (no text query) and `searchCatalog` (≥2 chars) with 300ms debounce; tracks owned paint IDs via `listOwnedCatalogIds`; client-side `hideOwned` filtering; infinite scroll via `loadMore()` — browse mode uses cursor-based pagination (25 items/page), search mode fetches up to 100 results and reveals 25 at a time via client-side chunking (`allSearchResults` buffer + `searchChunkIndex`); search-mode `loadMore` is synchronous with `nextTick` isLoading guard to prevent IntersectionObserver re-entry; `catalog.vue` uses an IntersectionObserver sentinel (`rootMargin: '200px'`, reactive `watch(sentinelRef)`) replacing the manual "Load more" button; dedicated `listCatalogRanges` subscription provides complete range options for the selected brand; `hasMore` resets on errors in both modes to prevent infinite error loops; returns `{ filters, results, isLoading, error, ownedIds, loadMore, hasMore, availableRanges }`
- **Auth state**: `useState('auth:isAuthenticated')` as reactive Nuxt state; JWT + refresh token persisted in `localStorage`; in-memory `authToken`/`refreshToken` variables serve as the authoritative fast-path so `fetchToken` avoids synchronous localStorage reads; `signIn`/`signUp` throw `'Backend not available — check CONVEX_URL configuration'` if `$convex` is undefined; `signOut` degrades gracefully (skips remote call, still clears local state)
- **Token refresh**: `client.setAuth(fetchToken, onAuthChange)` — Convex calls `fetchToken({ forceRefreshToken: true })` before JWT expiry; exchanges refresh token via `api.auth.signIn({ refreshToken })`; rotates refresh token if server returns a new one; failed refresh falls through to `null` triggering clean logout via `onAuthChange`
- **Data scoping**: every query/mutation resolves `userId` via `ctx.auth.getUserIdentity().subject`
- **Route guard**: `auth.global.ts` middleware — public exemptions: `/auth/**`, `/s/**`, `/discover`
- **Catalog-first add flow**: `paints/add.vue` is a three-state UI machine (`search` | `catalog` | `manual`). State `search`: inline debounced catalog search via `useCatalogSearch`, dropdown results, "Add manually" link. State `catalog`: selected paint summary card + `PaintForm` in `catalogMode` (brand, name, type, color, transparency, finish, specialType, barcode, brandCode render as read-only `<p>`; status + notes remain editable); `catalogInitialData` pre-fills the form; `selectedCatalogPaintId` passed to `paints.create` as `catalogPaintId`, cleared after successful submit. State `manual`: full editable `PaintForm`, no catalog link. `PaintCatalogSearch` component still exists in the codebase but is no longer used by `add.vue`.
- **`useCatalogPaint`**: subscribes to a single catalog paint by `Id<'catalogPaints'>` via `client.onUpdate`; returns `{ data, isLoading, error }` — `error` surfaces auth expiry or network failures that are otherwise indistinguishable from "no ID given"
- **Quick Add**: `PaintQuickAdd` offers Code and Scan tabs only (Manual tab removed). Code tab accepts a brand code and looks up a matching catalog paint; Scan tab uses the barcode scanner via `html5-qrcode`. On a successful match, a confirmation card is displayed and `addPaint` is called directly. Error messages direct users to the full Add Paint page rather than offering manual input.
- **Error handling**: try/catch/finally with local `error` ref + `isLoading` ref in page components
- **Styling**: Tailwind only — no inline styles, no per-component CSS; custom accent palette

## Directory Structure

```
app/
  components/
    paint/        CatalogFilters, CatalogPaintCard, PaintBarcodeScanner.client,
                  PaintCard, PaintCatalogSearch, PaintFilters, PaintForm,
                  PaintImportExport, PaintQuickAdd
    project/      ProjectCard, ProjectForm
    scheme/       SchemeCard, SchemeForm, SchemeStepEditor
    ui/           AppHeader, ColorSwatch, EmptyState, StatusBadge
  composables/    useAuth.ts, useCatalogBrowse.ts, useCatalogSearch.ts, useConvex.ts,
                  useImportExport.ts, usePaints.ts, useProjects.ts, useSchemes.ts
  layouts/        default.vue
  middleware/     auth.global.ts
  pages/
    auth/         login.vue, register.vue
    s/            [slug].vue  (public)
    discover.vue              (public)
    paints/       index.vue, add.vue, catalog.vue, [id].vue
    schemes/      index.vue, [id].vue
    projects/     index.vue, [id].vue
  plugins/        convex.client.ts
convex/
  schema.ts, auth.ts, auth.config.js, http.ts
  paints.ts, schemes.ts, projects.ts, migrations.ts, catalogSync.ts, crons.ts, colorFamily.ts
  _generated/     (auto-generated — do not edit)
```

## Infrastructure

- **Frontend**: Vercel with Nuxt adapter — ADR-006
- **Backend**: Convex Cloud (database, serverless functions, auth JWKS)
- **Deploy**: `npx convex deploy --cmd 'npm run build'` — atomic frontend + backend
- **Env var**: `NUXT_PUBLIC_CONVEX_URL` (preferred, Nuxt convention) or `CONVEX_URL` (fallback) — sets `runtimeConfig.public.convexUrl`
- **Auth provider**: @convex-dev/auth Password provider; Google OAuth deferred
- **External services**: none beyond Vercel + Convex Cloud
