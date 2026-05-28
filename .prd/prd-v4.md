---
version: 4
status: deferred
date: 2026-05-27
author: /review
previous: prd-v3.md
---

# Deferred Findings

Review findings that scored 50–79 — real but below the noise threshold. These inform the next planning cycle.

## PR #13 — fix: PRD v3 — auth router guard, error handling, API security hardening (2026-05-27)

### Pattern: code-quality-reviewer (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 75 | schemes/[id].vue:18 | `togglePublic()` never clears `error.value` before trying again — stale error persists after a successful retry | Add `error.value = ''` at the top of the try block, mirroring the pattern in `handleUpdate()` |

### Pattern: silent-failure-hunter (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 60 | schemes/[id].vue:133 | Error banner placed above steps list, far from the toggle button — on schemes with many steps the error is scrolled out of view when the user clicks toggle | Duplicate the error display inline inside the sharing section, or use a scoped `sharingError` ref rendered directly beside the button |

### Pattern: code-simplifier (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 50 | convex.client.ts:16,30 | Two `client.setAuth(tokenGetter, onInvalidate)` call sites have identical function bodies — DRY violation | Extract `tokenGetter` and `onInvalidate` as named constants at the top of the plugin; both call sites become one-liners |

## PR #35 — feat(paint): replace static catalog fallback with live searchCatalog (T9) (2026-05-28)

### Pattern: silent-failure-hunter (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 50 | PaintQuickAdd.vue:73 | `handleScanned` calls `lookup()` as fire-and-forget; the PR makes `lookup()` able to throw (new unguarded `searchCatalog` call), so rejections on the barcode scan path become fully unhandled | Fix the root cause first (add try/catch around `searchCatalog`) — that resolves this without touching `handleScanned` |

### Pattern: type-design-reviewer (1 finding)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 65 | PaintQuickAdd.vue:3 | `CatalogMatch` interface fuses two distinct sources (user paint, no `_id`; catalog result, always has `_id`) via optional `_id` — future code has no type-level signal about which branch it is in | Replace with a discriminated union `CatalogMatchFromUser \| CatalogMatchFromCatalog` with a `source` field; `confirmMatch` narrows on `source` to pass `catalogPaintId` correctly |
