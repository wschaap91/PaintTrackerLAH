# ADR-005: Tailwind CSS for styling with custom accent palette

- **Status:** Accepted
- **Date:** 2026-05-27
- **Deciders:** Wouter Schaap

---

## Context

The project needed a styling approach. Options considered:

- **Tailwind CSS** — utility-first, no runtime, excellent Nuxt integration
- **UnoCSS** — Tailwind-compatible, faster, but less ecosystem coverage
- **Vuetify / PrimeVue** — component libraries with full design systems
- **CSS Modules** — component-scoped CSS, standard Vue approach

## Decision

Use **Tailwind CSS** via `@nuxtjs/tailwindcss` with a custom `accent` color palette (indigo-based, 50–900 scale).

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      accent: {
        50: '#eef2ff', /* ... */ 500: '#6366f1', /* ... */ 900: '#312e81',
      },
    },
  },
},
```

## Rationale

- **Nuxt module** — `@nuxtjs/tailwindcss` integrates with Nuxt's build pipeline; no manual PostCSS config needed.
- **Utility-first suits component authoring** — Vue SFCs with Tailwind classes keep styling co-located with markup without scoped CSS overhead.
- **Custom accent palette** — a single semantic color token (`accent-*`) makes it easy to change the brand color globally without touching individual components.
- **No component library coupling** — raw Tailwind keeps the UI flexible; component library lock-in was not desirable for a personal tool.

## Consequences

- **All styling via Tailwind classes** — no `<style>` blocks in components (except for one-off animations that Tailwind can't express), no inline styles.
- **`assets/css/main.css`** — the global CSS entry point; used only for Tailwind's `@tailwind` directives and any base resets. Do not put component styles here.
- **`accent-*` is the brand color** — use `accent-500`/`accent-600` for primary interactive elements; `accent-100`/`accent-200` for backgrounds/badges.
- **Content paths** — `tailwind.config.ts` scans `./app/**/*.{vue,ts}`; any new directories outside `app/` that contain Tailwind classes must be added to `content`.
