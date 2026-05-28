# ADR-007: Public scheme sharing via slug-based URLs

- **Status:** Accepted
- **Date:** 2026-05-27
- **Deciders:** Wouter Schaap

---

## Context

The PRD required a way to share painting schemes publicly. Options for the URL scheme:

- **Token-based** (`/s/<uuid>`) — unguessable, opaque, harder to type or remember
- **Slug-based** (`/s/<name-xxxx>`) — human-readable, shareable in text, still has collision resistance via nanoid suffix
- **User/scheme path** (`/u/<user>/schemes/<name>`) — requires stable usernames, adds complexity

## Decision

Use **nanoid-generated slugs** stored on the scheme record. The public URL is `/s/[slug]`.

```ts
// convex/schemes.ts — slug generated at share time
const slug = nanoid(10)
await ctx.db.patch(args.schemeId, { isPublic: true, slug })
```

```
// Schema
schemes: defineTable({
  isPublic: v.optional(v.boolean()),
  slug:     v.optional(v.string()),
  ...
}).index('by_slug', ['slug'])
```

Public route: `app/pages/s/[slug].vue` — accessible without auth.

## Rationale

- **Human-friendly** — a slug like `edge-highlighting-a3kf9` is shareable in Discord messages, forum posts, or hobby blogs without looking like a UUID.
- **Collision-resistant** — nanoid(10) gives ~1 quadrillion combinations; collision probability is negligible.
- **Simple implementation** — slug is just a field on the scheme; lookup is a single indexed query (`by_slug`).
- **Lazy generation** — slug is only created when the user toggles `isPublic: true`; private schemes have no slug overhead.

## Consequences

- **Slug is permanent once shared** — changing the slug would break existing links. Do not regenerate slugs for existing public schemes.
- **Making a scheme private does not invalidate the slug** — the slug field persists even when `isPublic` is set to `false`. Anyone with the old link will get a "not found" response from `getPublicScheme` (which checks `isPublic`), but the slug is reserved.
- **`by_public` index missing** — `listPublicSchemes` currently does a full table scan. A `by_public` index on `['isPublic']` should be added to `schema.ts` before the discover page sees significant traffic (tracked in `.prd/prd-v2.md`).
- **Only schemes are publicly shareable in v1** — paints, projects, and wishlists are not. The PRD explicitly defers those.
