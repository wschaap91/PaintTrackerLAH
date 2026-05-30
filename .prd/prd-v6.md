---
version: 6
status: deferred
date: 2026-05-27
author: /review
previous: prd-v5.md
---

# Deferred Findings

Review findings that scored 50-79 — real but below the noise threshold. These inform the next planning cycle.

## PR #29 — T1: Extend schema — catalogPaints fields + searchIndex + paints.catalogPaintId (2026-05-27)

### Pattern: type-design-reviewer + code-quality-reviewer (2 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 75 | convex/schema.ts:73-74 | `finish` and `transparency` in `catalogPaints` are `v.string()` (required) but `paints` uses `v.union(v.string(), v.null())` for the same fields — type mismatch if sync source omits these values | Change to `v.union(v.string(), v.null())` to match the paints table and handle missing source data |
| 55 | convex/schema.ts:76 | `syncedAt: v.optional(v.number())` breaks the codebase pattern of `v.union(T, v.null())` for all nullable fields — creates `undefined` vs `null` inconsistency in queries | Use `v.union(v.number(), v.null())` to align with the established nullability convention |

### Pattern: code-simplifier (2 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 70 | convex/schema.ts:20-27 | `catalogPaintId` added to `paints` has no reverse index — any "which user paints link to catalog entry X?" query requires a full table scan | Add `.index('by_catalog_paint', ['catalogPaintId'])` to the `paints` table |
| 60 | convex/schema.ts:79 | `by_range` index on a single `range` field returns cross-brand results; paint ranges are brand-scoped by nature | Replace with compound `.index('by_brand_range', ['brand', 'range'])` to support realistic queries |

## PR #53 — T1: schema + color family foundation (2026-05-29)

### Pattern: code-quality-reviewer (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 60 | convex/colorFamily.ts:19 | Dead `if (h < 20) return 'orange'` branch — after `h < 10` guard, hues 10–19 always reach the `h < 46` branch instead; accidentally correct but misleading | Remove the dead `if (h < 20) return 'orange'` line |

### Pattern: type-design-reviewer (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 65 | convex/colorFamily.ts:3 | `classifyColorFamily()` returns plain `string` instead of a string literal union of the 12 known color families — loses compile-time exhaustiveness checking and allows schema to store arbitrary strings | Define `ColorFamily` type as `'red' \| 'orange' \| ... \| 'metallic'`, use as return type, and update schema to use `v.union(v.literal(...), ...)` |

## PR #106 — feat: v8 Wave 3 — scheme area types, public area view, shopping share toggle (2026-05-31)

### Pattern: type-design-reviewer (2 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 70 | app/pages/schemes/[id].vue:67 + app/pages/schemes/add.vue:8 | `StepPayload` type used in `as StepPayload[]` cast but never imported — Nuxt auto-imports composable functions, not named type exports | Add `import type { StepPayload } from '~/composables/useSchemes'` |
| 65 | app/composables/useSchemes.ts:5-6 + app/pages/s/[slug].vue | `SchemeArea`/`SchemeStep` exported but unused; page defines local `Area`/`Step` with near-identical shapes — will drift independently | Either delete unused exports or import them in the page instead of re-declaring |

### Pattern: code-simplifier (2 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 70 | app/pages/schemes/[id].vue:66 + app/pages/schemes/add.vue:6 | `as StepPayload[]` cast bridges `string` to branded `Id<'paints'>` — narrower than `as any` but still bypasses real type mismatch | Define `StepFormData` with `paintId: string` and convert inside the composable |
| 50 | app/pages/s/[slug].vue (template) | `hasAreas` computed drives two near-identical template blocks (~25 lines duplicated) — single `v-for` with `v-if="group.areaName"` on heading eliminates duplication | Remove `hasAreas`, use single loop with conditional heading |

### Pattern: code-quality-reviewer (2 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 50 | app/components/paint/ShoppingShareToggle.vue:28 | `copyLink` uses `window.location.origin` directly instead of the SSR-guarded `origin` constant defined on line 7 — inconsistent, bypasses the guard | Use `origin` instead of `window.location.origin` in `copyLink` |
| 50 | app/pages/s/[slug].vue (stepGroups computed) | Two-pass O(areas*steps) grouping loop with `areas.find()` is unnecessarily complex | Simplify to single pass over steps using `Map.has()` for bucket selection |
