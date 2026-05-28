# ADR-004: Auth token stored in localStorage

- **Status:** Accepted
- **Date:** 2026-05-27
- **Deciders:** Wouter Schaap

---

## Context

Convex Auth returns a JWT on sign-in. The token needs to be persisted across page refreshes and passed to the Convex client on every query/mutation. Storage options:

- **`localStorage`** — simple, synchronous, works in any browser context
- **`sessionStorage`** — cleared on tab close; bad UX for a productivity tool
- **`httpOnly` cookie** — XSS-safe, requires a server to set it; incompatible with a pure SPA + Convex architecture (no Nuxt server)
- **In-memory (no persistence)** — forces re-login on every refresh

## Decision

Store the Convex JWT in **`localStorage`** under the key `convex_auth_token`.

```ts
// convex.client.ts
localStorage.setItem('convex_auth_token', token)
client.setAuth(async () => localStorage.getItem('convex_auth_token'), onInvalidate)
```

## Rationale

- **SPA constraint** — `ssr: false` means there is no Nuxt server to set httpOnly cookies; localStorage is the practical option for a client-only app.
- **Convex client expects `async () => string | null`** — the `setAuth` API is designed for localStorage-style retrieval; it fetches the token before each request automatically.
- **Acceptable risk** — the app is a personal tool with no payment data, PII beyond an email address, or privileged access. XSS risk is real but proportionate.

## Consequences

- **XSS risk** — any injected script can read the token. Mitigation: the app renders no user-supplied HTML, uses Tailwind classes only, and Nuxt's template engine escapes output by default.
- **Token persistence** — users stay signed in across refreshes and browser restarts until the token expires or they sign out.
- **Token invalidation** — the `setAuth` callback's `onInvalidate` function clears localStorage when Convex rejects the token, forcing a re-login.
- **No server-side session** — if the token is compromised, there is no server-side revocation mechanism in v1; token expiry is the only control.
