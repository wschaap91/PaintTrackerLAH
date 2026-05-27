---
version: 2
status: archived
date: 2026-05-27
author: /review
previous: prd-v1.md
---

# Deferred Findings

Review findings that scored 50–79 — real but below the noise threshold. These inform the next planning cycle.

## PR #6 — feat: auth, data scoping, public sharing, discovery, import/export (2026-05-27)

### Pattern: silent-failure-hunter (4 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 60 | discover.vue:28 | `load()` has no try/catch — any error leaves `isLoading` permanently true, showing infinite spinner | Wrap body in try/finally, set `isLoading.value = false` in finally |
| 60 | app/pages/s/[slug].vue:14 | `onMounted` has no try/catch — query error leaves spinner frozen on public page | Add try/finally; set `notFound.value = true` on catch |
| 60 | app/pages/schemes/[id].vue:18 | `togglePublic()` swallows mutation errors silently; page has an `error` ref that goes unused | `try { await setPublic(...) } catch { error.value = 'Failed to update sharing settings.' }` |
| 60 | app/pages/schemes/[id].vue:23 | `copyLink()` clipboard failure is fully silent; `copied` stays false, user gets no feedback | Wrap `navigator.clipboard.writeText` in try/catch; show fallback message |

### Pattern: security-reviewer (2 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 60 | convex/schemes.ts:177 | `getPublicScheme` spreads full scheme doc including `userId` (internal identifier) to anonymous callers | Project only needed fields: `_id`, `name`, `description`, `slug`, `isPublic`, `_creationTime` |
| 60 | convex/schemes.ts:169 | `getPublicScheme` returns full paint docs (including `userId`, `barcode`, `notes`) to unauthenticated callers | Project only `{ name, brand, hexColor }` from paint in `stepsWithPaints` map |

### Pattern: code-quality-reviewer (2 findings)

| Score | File | Finding | Suggestion |
|-------|------|---------|------------|
| 60 | convex/schemes.ts:224 | `listPublicSchemes` does a full table scan on every /discover page load — reads all private schemes too | Add `by_public` index to schema; use `.withIndex('by_public', q => q.eq('isPublic', true))` |
| 60 | convex/paints.ts:107 | `bulkCreate` has no batch size cap — authenticated user can send 10,000+ items exhausting mutation budget | Add `{ maxLength: 500 }` to the `paints` array validator or throw if `args.paints.length > 500` |
