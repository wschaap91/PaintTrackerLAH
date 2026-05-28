# ADR-003: Authentication via Convex Auth (Password provider)

- **Status:** Accepted
- **Date:** 2026-05-27
- **Deciders:** Wouter Schaap

---

## Context

The app needed user accounts to scope data per user. The PRD listed email/password + Google OAuth as the initial target. Options for auth:

- **Clerk** — managed auth service, excellent DX, Nuxt SDK available
- **Auth0** — established managed auth
- **Convex Auth (`@convex-dev/auth`)** — auth built into the Convex runtime
- **Custom JWT** — roll our own

## Decision

Use **`@convex-dev/auth`** with the **`Password` provider only** (email/password). Google OAuth is deferred.

```ts
// convex/auth.ts
import { convexAuth } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
})
```

## Rationale

- **No external service** — auth lives in the same Convex deployment; no additional vendor, billing, or SDK to integrate.
- **TypeScript native** — auth functions are Convex actions called with the same typed API as everything else.
- **Sufficient for v1** — email/password covers the core multi-user requirement; Google OAuth can be added later by extending the `providers` array.

## Consequences

- **Google OAuth not yet implemented** — the PRD listed it, but it was deferred to keep scope manageable. Add it by importing `Google` from `@convex-dev/auth/providers/Google` and extending `auth.config.js`.
- **Password reset flow** — not implemented in v1; users cannot recover forgotten passwords without a manual reset.
- **`userId` is `identity.subject`** — a string in the format `<provider>:<user-id>`; always retrieve it via `ctx.auth.getUserIdentity()?.subject` rather than hardcoding formats.
- **Auth tables are managed by Convex Auth** — the `authTables` spread in `schema.ts` adds the required system tables; do not modify them manually.
