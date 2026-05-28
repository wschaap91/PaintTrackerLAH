# PaintTrackerLAH — Spec

Last updated: 2026-05-28 (after PRD v5 cycle, Wave 3 — useCatalogSearch composable + PaintCatalogSearch component)

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
  finish: string, transparency: string,
  specialType?: string | null, barcode?: string | null,
  openMiniPaintsId?: string, syncedAt?: number }
// indexes: by_brand, by_range, by_brand_code, by_open_mini_paints_id
// searchIndex: search_name (searchField: name, filterFields: [brand])
```

Auth tables provided by `@convex-dev/auth` (ADR-003).

## API Surface

**paints.ts** (all authenticated)
- `list({})` → `Paint[]`
- `get({ id })` → `Paint | null`
- `create({ name, brand, hexColor, paintType?, status?, barcode?, notes?, quantity?, catalogPaintId? })` → `Id<"paints">`
- `update({ id, ...fields })` → `void`
- `remove({ id })` → `void`
- `bulkCreate({ paints[] })` → `{ created, skipped }` — dedupes by name+brand
- `search({ query })` → `Paint[]`

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
- `searchCatalog({ q, brand?, limit? })` → `CatalogPaint[]` — auth required; uses `search_name` searchIndex; limit clamped 1–25 (default 10)
- `getCatalogPaint({ id })` → `CatalogPaint | null` — auth required
- `internal.upsertCatalogPaint(...)` — internalMutation; upserts by `openMiniPaintsId`, fallback brand+brandCode for pre-sync rows; always sets `syncedAt`
- `internal.syncCatalog({})` — internalAction; cursor-paged HTTP fetch from OpenMiniPaints API; scheduled nightly via `crons.ts`; returns `{ synced, errors }`

**http.ts** — HTTP action routes for Convex Auth callbacks

## Key Patterns

- **Composable-only data access**: `useConvexQuery`, `useConvexMutation`, `useConvexClient` wrap all Convex calls (ADR-008); `useCatalogSearch` uses `client.onUpdate` directly for debounced real-time search with explicit subscription lifecycle (disposed guard, manual unsubscribe)
- **Domain composables**: `usePaints`, `useSchemes`, `useProjects`, `useImportExport`
- **Auth state**: `useState('auth:isAuthenticated')` as reactive Nuxt state; JWT + refresh token persisted in `localStorage`; in-memory `authToken`/`refreshToken` variables serve as the authoritative fast-path so `fetchToken` avoids synchronous localStorage reads
- **Token refresh**: `client.setAuth(fetchToken, onAuthChange)` — Convex calls `fetchToken({ forceRefreshToken: true })` before JWT expiry; exchanges refresh token via `api.auth.signIn({ refreshToken })`; rotates refresh token if server returns a new one; failed refresh falls through to `null` triggering clean logout via `onAuthChange`
- **Data scoping**: every query/mutation resolves `userId` via `ctx.auth.getUserIdentity().subject`
- **Route guard**: `auth.global.ts` middleware — public exemptions: `/auth/**`, `/s/**`, `/discover`
- **Error handling**: try/catch/finally with local `error` ref + `isLoading` ref in page components
- **Styling**: Tailwind only — no inline styles, no per-component CSS; custom accent palette

## Directory Structure

```
app/
  components/
    paint/        PaintCard, PaintCatalogSearch, PaintForm, PaintList, PaintQuickAdd, PaintSearch
    project/      ProjectCard, ProjectForm, ProjectPaintRow, ProjectSchemeRow
    scheme/       SchemeCard, SchemeForm, SchemeStepRow
    ui/           AppHeader, EmptyState, ErrorBanner, LoadingSpinner
  composables/    useAuth.ts, useCatalogSearch.ts, useConvex.ts, usePaints.ts,
                  useSchemes.ts, useProjects.ts, useImportExport.ts
  layouts/        default.vue
  middleware/     auth.global.ts
  pages/
    auth/         login.vue, register.vue
    s/            [slug].vue  (public)
    discover.vue              (public)
    paints/       index.vue, [id].vue
    schemes/      index.vue, [id].vue
    projects/     index.vue, [id].vue
  plugins/        convex.client.ts
  utils/          known-paints.ts  (~150 static paint entries)
convex/
  schema.ts, auth.ts, auth.config.js, http.ts
  paints.ts, schemes.ts, projects.ts, migrations.ts, catalogSync.ts, crons.ts
  _generated/     (auto-generated — do not edit)
```

## Infrastructure

- **Frontend**: Vercel with Nuxt adapter — ADR-006
- **Backend**: Convex Cloud (database, serverless functions, auth JWKS)
- **Deploy**: `npx convex deploy --cmd 'npm run build'` — atomic frontend + backend
- **Auth provider**: @convex-dev/auth Password provider; Google OAuth deferred
- **External services**: none beyond Vercel + Convex Cloud
