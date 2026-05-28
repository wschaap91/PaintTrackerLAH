# ADR-001: Nuxt 4 as the frontend framework (SPA mode)

- **Status:** Accepted
- **Date:** 2026-05-27
- **Deciders:** Wouter Schaap

---

## Context

We needed a Vue-based framework for PaintTrackerLAH. The app is heavily client-side (real-time Convex subscriptions, barcode scanning via `html5-qrcode`, drag-to-reorder with `vuedraggable`) and has no SEO requirement — it is a personal/private tool.

## Decision

Use **Nuxt 4** with `ssr: false` (SPA mode).

Key config:
```ts
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
})
```

## Rationale

- **Vue ecosystem** — Vue 3 Composition API is the preferred authoring style; Nuxt adds file-based routing, auto-imports, and a module ecosystem on top.
- **SPA is correct here** — all data comes from Convex real-time subscriptions; SSR would add complexity without benefit since there's nothing to pre-render for crawlers.
- **Nuxt auto-imports** — eliminates repetitive import boilerplate for `ref`, `computed`, `useNuxtApp`, composables, and components.
- **Module ecosystem** — `@nuxtjs/tailwindcss` and `@nuxt/eslint` drop in cleanly.

## Consequences

- The app directory follows the **Nuxt 4 `app/` directory convention** — all Vue source lives under `app/`, not at the root.
- There is no server-side rendering; initial HTML is a blank shell. Fine for an authenticated tool, not suitable if public SEO ever becomes a requirement.
- Vercel deploys the Nuxt output via the `nuxtjs` framework preset.
