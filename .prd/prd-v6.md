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

## PR #109 — feat: v8 Wave 4 — SchemeAreaEditor and shopping list page (2026-05-31)

### Pattern: code-quality-reviewer + silent-failure-hunter (2 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 75 | app/components/scheme/SchemeStepEditor.vue:38-40 | `stepKey` fallback `(paintId ?? '') + technique` produces duplicate keys for legacy steps without `_uid` that share the same paint and technique — vuedraggable misplaces or drops items silently | Use index-based fallback: `step._uid ?? \`legacy-${index}\`` or backfill `_uid` on load |
| 70 | app/components/scheme/SchemeAreaEditor.vue:29-35 | `deleteArea(index)` uses array index which can point to the wrong area if drag reorder fires between click and handler execution — wrong area deleted silently, steps moved to ungrouped | Use `_uid` lookup: `deleteArea(uid: string)` with `findIndex` for identity-safe deletion |

## PR #135 — feat: v8 Wave 2 — PaintCardCompact icons, paints page integration (2026-06-02)

### Pattern: code-simplifier (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 50 | app/pages/paints/index.vue:73-74 | `searchBarValue` computed is a pass-through wrapper (`() => searchFilters.value`) with no transformation — unnecessary indirection after filter unification removed the merge logic | Remove the computed and bind `searchFilters` directly in the template |
