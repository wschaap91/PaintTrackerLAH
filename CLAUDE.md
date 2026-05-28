# PaintTrackerLAH — Claude Code Guide

A miniature paint collection tracker built with **Nuxt 4** (SPA) and **Convex** (real-time backend). Users manage their paint inventory, painting schemes, and projects; they can share schemes publicly via a slug URL.

---

## Project layout

```
app/                    # Nuxt app directory (Nuxt 4 convention)
  components/
    paint/              # Paint-specific UI components
    project/            # Project-specific UI components
    scheme/             # Scheme-specific UI components
    ui/                 # Generic reusable UI primitives
  composables/
    useAuth.ts          # Auth state + signIn/signUp/signOut
    useConvex.ts        # Low-level Convex client wrappers (query/mutation/client)
    usePaints.ts        # Paint CRUD composable
    useSchemes.ts       # Scheme CRUD + sharing composable
    useProjects.ts      # Project CRUD composable
    useImportExport.ts  # JSON import/export composable
  layouts/
    default.vue         # App shell with nav
  middleware/
    auth.global.ts      # Route guard — redirects to /auth/login if no token
  pages/
    auth/               # login + register pages (public)
    s/[slug].vue        # Public scheme view (public, no auth required)
    discover.vue        # Browse public schemes (public, no auth required)
    paints/             # Paint collection management
    schemes/            # Scheme management
    projects/           # Project management
  plugins/
    convex.client.ts    # Convex client init + token persistence
  utils/
    known-paints.ts     # Static paint catalog (~150 entries)

convex/                 # Convex backend (runs on Convex cloud)
  schema.ts             # Database schema — source of truth for all table shapes
  auth.ts               # Convex Auth config (Password provider)
  auth.config.js        # Convex Auth JWT/JWKS config
  paints.ts             # Paint queries + mutations
  schemes.ts            # Scheme queries + mutations + public sharing
  projects.ts           # Project queries + mutations
  migrations.ts         # One-off data migrations
  http.ts               # HTTP action routes (Convex HTTP)
  _generated/           # Auto-generated — do NOT edit
```

---

## Development

```bash
# Start Nuxt dev server (frontend only)
npm run dev

# Deploy Convex backend changes (required when changing convex/)
npx convex dev          # watch mode — auto-deploys on save
npx convex deploy       # one-shot deploy

# Both together for local full-stack dev
npx convex dev &
npm run dev
```

Environment variables are in `.env.local`:
- `CONVEX_URL` — the Convex deployment URL (required by the Nuxt runtime)

---

## Architecture decisions

See `.adr/` for full reasoning. Key decisions:

| Decision | Choice | ADR |
|---|---|---|
| Frontend framework | Nuxt 4, SPA mode (`ssr: false`) | ADR-001 |
| Backend / database | Convex (real-time, no REST API layer) | ADR-002 |
| Authentication | Convex Auth, Password provider | ADR-003 |
| Auth token storage | `localStorage` | ADR-004 |
| Styling | Tailwind CSS with custom `accent` color palette | ADR-005 |
| Deployment | Vercel (Nuxt adapter) + Convex cloud | ADR-006 |
| Public scheme sharing | Slug-based URLs (`/s/[slug]`) via nanoid | ADR-007 |
| Convex data access | Custom composables (`useConvexQuery`, `useConvexMutation`) | ADR-008 |

---

## Convex patterns

**All Convex access goes through the composables** — never import the generated API directly in components.

```ts
// In a composable
const { data, isLoading } = useConvexQuery(api.paints.list, {})
const createPaint = useConvexMutation(api.paints.create)

// Mutations
await createPaint({ brand: 'Citadel', name: 'Abaddon Black', ... })
```

**Data scoping** — every query and mutation scopes data to the caller's identity:
```ts
// In convex/*.ts — always get userId from auth context
const identity = await ctx.auth.getUserIdentity()
if (!identity) throw new Error('Not authenticated')
const userId = identity.subject
```

**Public routes** — `getPublicScheme` and `listPublicSchemes` are the only queries that do NOT require auth. They must only return fields safe for public consumption (no `userId`, minimal paint fields).

---

## Auth flow

1. `convex.client.ts` plugin initialises `ConvexClient` and restores JWT from `localStorage`
2. `auth.global.ts` middleware blocks all routes except `/auth/**`, `/s/**`, and `/discover`
3. `useAuth.ts` composable calls `api.auth.signIn` (Convex action) which returns a JWT
4. JWT is stored in `localStorage` and passed to `client.setAuth()` on every request
5. On sign-out, `localStorage` is cleared and `client.clearAuth()` is called

---

## Schema conventions

- All user-owned tables have a `userId: v.optional(v.string())` field (optional for legacy rows)
- User identity comes from `ctx.auth.getUserIdentity()?.subject` — a string
- Indexes follow the pattern `by_user`, `by_brand`, `by_slug`, etc.
- `schemeSteps` and `projectSchemes`/`projectPaints` are join tables — no `userId` needed (scoped via parent)

---

## Known open issues (from last review)

These are real issues — fix before adding new features:

- `discover.vue` — `load()` has no try/finally; spinner gets stuck on error
- `s/[slug].vue` — `onMounted` has no try/catch; public page can freeze
- `schemes/[id].vue` — `togglePublic()` swallows errors silently; `copyLink()` clipboard failure is silent
- `convex/schemes.ts` — `getPublicScheme` leaks `userId` and full paint docs to anonymous callers
- `convex/schemes.ts` — `listPublicSchemes` does a full table scan; needs `by_public` index
- `convex/paints.ts` — `bulkCreate` has no batch size cap (DoS risk)

See `.prd/prd-v2.md` for full details.

---

## 🔄 Open decisions

> Updated by `/adr` on 2026-05-27. Run `/adr` to refresh.

All decisions captured. No open items.

---

## Code style

- **TypeScript strict mode** — all files must typecheck cleanly
- **Vue 3 Composition API** — `<script setup lang="ts">` in all components
- **No `any`** — use proper types; if you must escape, add `// eslint-disable-next-line @typescript-eslint/no-explicit-any` with a comment explaining why
- **Composables for all data access** — no raw Convex calls in components
- **Tailwind for all styling** — no inline styles, no separate CSS files except `assets/css/main.css`
- **Nuxt auto-imports** — `ref`, `computed`, `useNuxtApp`, `useState`, `navigateTo` etc. are auto-imported; don't import them explicitly
