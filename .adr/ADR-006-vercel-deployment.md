# ADR-006: Vercel for frontend deployment + Convex cloud for backend

- **Status:** Accepted
- **Date:** 2026-05-27
- **Deciders:** Wouter Schaap

---

## Context

The app has two deployable units: the Nuxt SPA (static assets) and the Convex backend (functions + database). They need to deploy together reliably.

## Decision

Deploy the **Nuxt SPA to Vercel** using the `nuxtjs` framework preset. Deploy the **Convex backend to Convex cloud** as part of the Vercel build step.

```json
// vercel.json
{
  "buildCommand": "npx convex deploy --cmd 'npm run build' --cmd-url-env-var-name CONVEX_URL",
  "framework": "nuxtjs",
  "installCommand": "npm install"
}
```

## Rationale

- **Vercel + Nuxt** — Vercel's `nuxtjs` preset handles the Nuxt 4 build with zero config; the SPA output is served as static files from the CDN.
- **Convex deploy in build step** — `npx convex deploy` runs before `npm run build`; the `--cmd-url-env-var-name CONVEX_URL` flag injects the deployed Convex URL into the Nuxt build, so the frontend always points at the correct backend version.
- **Atomic deploys** — Convex backend and Nuxt frontend are deployed together in one Vercel build; no mismatch between schema versions and frontend expectations.
- **Zero infrastructure** — no servers to manage, no Docker, no k8s; both platforms are fully managed.

## Consequences

- **`CONVEX_URL` is set by Convex deploy** — do not manually set this env var in Vercel; the build command injects it dynamically.
- **Preview deployments** — Vercel preview deployments run `npx convex deploy` against the Convex preview environment. The `.vercel/.env.preview.local` file holds preview-specific env vars.
- **Convex dashboard** — the Convex dashboard (dashboard.convex.dev) is the place to inspect data, run queries, and view function logs. There is no local database to query.
- **Single Convex deployment for production** — all users share one Convex backend (multi-tenant via `userId` scoping, not per-user deployments).
