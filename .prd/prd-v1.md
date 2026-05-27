---
version: 1
status: draft
date: 2026-05-27
author: Wouter Schaap
previous: null
---

# PaintTrackerLAH — Auth, Sharing & Wishlist

## 1. Problem

PaintTrackerLAH is a single-user app today. Every visitor sees the same data, and there is no concept of identity. This blocks three things:

- Multiple people cannot use the app without overwriting each other's collections
- There is no way to share a collection or wishlist with someone else
- The wishlist is just a status filter on owned paints — not a real gift-list people can interact with

Without solving auth first, none of the social or sharing features are possible. Without sharing, the app only serves the person who built it.

---

## 2. Solution

Add user accounts to PaintTrackerLAH using Convex Auth (email/password and Google OAuth). Scope all existing data to the authenticated user. Introduce a standalone wishlist that can be shared — publicly via link, or privately by email/username — where recipients can claim items to signal they have bought them. Add read-only collection sharing using the same model. Wire up a catalog search composable that hits the static known-paints data today and will switch to the OpenMiniPaints API when it exists.

---

## 3. Scope

| This PRD covers | This PRD does NOT cover |
|---|---|
| Email/password registration and login | Admin user management |
| Google OAuth login | Other OAuth providers (GitHub, Apple, etc.) |
| User profile (name, avatar via OAuth) | Profile editing page |
| userId stamped on paints, schemes, projects | Migrating existing data to a specific user |
| Standalone wishlist (create, add items, delete) | Wishlist item drag-to-reorder |
| Wishlist item claiming (cross off for gifting) | Purchasing / payment integration |
| Public link sharing for wishlists | Wishlist item comments |
| Private sharing by email and username | Push notifications for claims |
| Read-only collection sharing (public + private) | Collection sharing with write access |
| "Shared with me" inbox for private invites | Invite expiry / revocation |
| Catalog search composable (static data, v1) | OpenMiniPaints API integration (separate PRD) |

---

## 4. Architecture

### Component structure

```
convex/
  auth.config.ts          # Convex Auth configuration (email + Google)
  users.ts                # users table queries and mutations
  wishlists.ts            # wishlist CRUD + item claiming
  shares.ts               # sharing tokens, invites, access checks
  schema.ts               # updated — adds userId to all tables, new tables

app/
  middleware/
    auth.ts               # redirects unauthenticated users to /login
  pages/
    login.vue             # email/password + Google login
    register.vue          # email/password registration
    wishlist/
      index.vue           # my wishlists
      [id].vue            # view + manage a wishlist (owner)
    shared/
      collection/[token].vue   # public read-only collection view
      wishlist/[token].vue     # public wishlist view with claiming
    account/
      shared-with-me.vue  # private invites inbox
  components/
    auth/
      LoginForm.vue
      RegisterForm.vue
      GoogleButton.vue
    wishlist/
      WishlistCard.vue
      WishlistItemRow.vue     # shows claimed state
      WishlistShareModal.vue  # public link + invite by email/username
    collection/
      CollectionShareModal.vue
  composables/
    useAuth.ts            # current user, login, logout, register
    useWishlists.ts       # wishlist CRUD composable
    useCatalogSearch.ts   # fuzzy search over static catalog (API-ready interface)
  utils/
    known-paints.ts       # expanded with more entries (existing file)
```

### Key components

**`useAuth.ts`** — exposes `currentUser`, `isAuthenticated`, `login()`, `logout()`, `register()`. All other composables depend on this for the current userId.

**`useWishlists.ts`** — wraps Convex wishlist queries and mutations. Provides `wishlists`, `createWishlist()`, `addItem()`, `removeItem()`, `claimItem()`, `unclaimItem()`.

**`useCatalogSearch.ts`** — takes a query string and returns results grouped by brand. Today it fuzzy-searches the static `known-paints.ts` array client-side. The interface matches what the OpenMiniPaints API will return, so swapping the data source later requires no UI changes.

**`shares.ts` (Convex)** — all sharing logic lives here. Generates tokens, validates access on read, stores private invites. Used by both collection and wishlist sharing.

**`WishlistItemRow.vue`** — renders a wishlist item with its claim state. If claimed, shows the claimer's name and a strikethrough. If you are the claimer, shows an unclaim button. If unclaimed and you are a viewer (not the owner), shows a claim button.

**`auth middleware`** — runs on every page. Redirects to `/login` if no session. Exempts `/login`, `/register`, and `/shared/**` routes (shared views are public).

### Data flow

**Auth:**
```
User visits app
  → auth middleware checks session
  → no session → redirect /login
  → login form submits credentials
  → Convex Auth validates → issues session token
  → stored in browser → user lands on /paints (their own data)
```

**Wishlist claiming:**
```
Recipient opens /shared/wishlist/[token]
  → shares.ts validates token, returns wishlist + items
  → items render with claim state
  → recipient clicks "I'll get this"
  → claimItem() mutation runs
  → claimedBy + claimedAt written to wishlistItems
  → all viewers of the same wishlist see item as claimed (realtime via Convex)
```

**Private collection share:**
```
Owner opens CollectionShareModal
  → types email or username
  → share invite created in shares table
  → invitee logs in → sees invite in /account/shared-with-me
  → clicks accept → /shared/collection/[token] loads owner's paints read-only
```

### Integration points

- `convex/schema.ts` — add `userId` to `paints`, `schemes`, `projects`; add `users`, `wishlists`, `wishlistItems`, `shares` tables
- `convex/paints.ts`, `schemes.ts`, `projects.ts` — all `list` queries gain `userId` filter from `ctx.auth`; all `create` mutations stamp `userId`
- `PaintQuickAdd.vue` — "Search catalog" tab added, calls `useCatalogSearch()`
- `app.vue` / layout — header gains user avatar + logout; conditional rendering based on auth state

---

## 5. Success Metrics

| Metric | Target |
|---|---|
| Register and log in with email/password | Works end to end, session persists on refresh |
| Register and log in with Google | Works end to end |
| Two users see only their own paints | Verified by logging in as two separate accounts |
| Create a wishlist and add 3 items | Items persist, render correctly |
| Share wishlist via public link (incognito) | Recipient can view and claim items without an account |
| Claimed item shows as claimed to a second viewer | Realtime update visible without page refresh |
| Share collection via private invite | Invitee sees it in shared-with-me inbox |
| Catalog search returns results grouped by brand | Works for at least Citadel and Vallejo queries |

---

## 6. Out of Scope

- OpenMiniPaints API integration — the catalog search uses static data in v1
- Stripe / metered billing for the catalog API
- User profile editing (display name, avatar upload)
- Notifications (email or push) when a wishlist item is claimed
- Invite expiry or revoke access
- Sharing schemes or projects (collection and wishlist only in v1)
- Import / export (tracked in issue #5, separate cycle)
- Admin or moderation tooling

---

## User Flow — Wishlist Sharing

```
Owner                          Recipient (logged in)        Recipient (anonymous)
  │                                    │                            │
  ├─ creates wishlist                  │                            │
  ├─ adds items from catalog           │                            │
  ├─ clicks Share                      │                            │
  │   ├─ copies public link ──────────────────────────────────────►│
  │   └─ or invites by email/username─►│                            │
  │                                    │                            │
  │                              sees in inbox              opens public link
  │                              opens wishlist             views wishlist
  │                                    │                            │
  │                              claims item                 [must log in to claim]
  │◄────────────────────────────────── │ ──── realtime claim ──────►│
  │  claimedBy shown to all            │                            │
```

---

## Dependencies & Risks

| Dependency / Risk | Impact | Mitigation |
|---|---|---|
| Convex Auth setup (new to project) | Auth is the foundation — if misconfigured, nothing works | Set up auth in isolation before touching other features |
| Migrating existing data | Current paints have no userId — they'll be invisible after auth is added | Seed script assigns existing rows to the first user (owner account) |
| Public shared routes bypass auth middleware | Accidental auth block on `/shared/**` routes breaks sharing | Explicitly whitelist `/shared/**` in middleware |
| Static catalog coverage | Catalog search feels limited with ~30 paints | Expand `known-paints.ts` to ~150 entries as part of this cycle |

---

## Privacy & Security

- All Convex queries check `ctx.auth.getUserIdentity()` before returning data — no row is accessible without a valid session, except explicitly shared resources via token
- Share tokens are UUIDs — unguessable, single-use for private invites
- Public share links expose only the data the owner chose to share (collection or wishlist) — no other user data leaks through them
- Google OAuth is handled by Convex Auth — no OAuth credentials stored in the app
