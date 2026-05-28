# ADR-002: Convex as the backend and database

- **Status:** Accepted
- **Date:** 2026-05-27
- **Deciders:** Wouter Schaap

---

## Context

The app needs persistent storage for paints, schemes, and projects. Options considered:

- **Supabase** — Postgres + realtime via websockets, good Vue support
- **Firebase/Firestore** — NoSQL, mature realtime SDK
- **PocketBase** — self-hosted, simple
- **Convex** — TypeScript-first, real-time subscriptions, built-in auth, serverless functions

## Decision

Use **Convex** as the sole backend: database, serverless functions, auth, and real-time subscriptions in one platform.

## Rationale

- **TypeScript end-to-end** — schema, queries, and mutations are all typed TypeScript; the generated `_generated/api.d.ts` gives full type safety from frontend to backend with no manual API contracts.
- **Real-time by default** — `client.onUpdate()` subscriptions mean the UI stays live without polling or manual cache invalidation.
- **No REST API to build** — queries and mutations are called directly as typed function references; no route handlers, no serialisation layer.
- **Built-in auth** — `@convex-dev/auth` integrates auth into the same runtime; no separate auth service needed.
- **Serverless** — zero infrastructure to manage; Convex handles scaling, backups, and indexing.

## Consequences

- **All backend logic lives in `convex/`** — no Express/Hono/Nitro server; the Convex cloud is the only server.
- **Convex IDs are opaque strings** (`Id<'paints'>`) — treat them as opaque references; do not construct or parse them manually.
- **`convex/_generated/` is auto-generated** — never edit these files; run `npx convex dev` or `npx convex deploy` to regenerate after schema or function changes.
- **Indexes must be declared in `schema.ts`** — Convex does not support ad-hoc queries without a matching index; always add the index before the query.
- **Deployment coupling** — Convex backend and Nuxt frontend must be deployed together (handled by `vercel.json` `buildCommand`).
