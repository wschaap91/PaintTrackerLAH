---
version: 8
status: built
date: 2026-06-01
author: Wouter Schaap
previous: prd-v7.md
---

# PaintTrackerLAH — Mobile UX Overhaul

## 1. Problem

The mobile experience wastes vertical space and has visual inconsistencies that make the app feel unpolished:

**Dual header.** On mobile, every page shows both the AppHeader ("PaintTracker" + hamburger) and the page-level title. The BottomTabBar already handles primary navigation, so the AppHeader adds nothing on mobile — it just eats ~64px of screen real estate.

**Small, inconsistent action buttons.** The owned-check and wishlist-heart icons on paint cards are 20px (w-5 h-5) — small touch targets on mobile. Worse, they appear inconsistently: the All tab shows both, but Owned and Wishlist tabs only show contextual buttons. You can't quickly un-own a paint from the Owned tab without both buttons visible.

**Wrong brand colour.** The app uses an indigo/purple accent palette. The desired brand identity is a warm indian yellow — a golden, paint-adjacent colour that fits the miniature painting domain better.

**Confusing per-tab filters.** The search bar and brand filter sit visually above the tab pills, implying they apply globally. But brand state resets when switching tabs and is tracked separately per tab. Users expect the filter to persist across tabs.

**No sticky navigation.** When scrolling through hundreds of paints, the search bar and tab pills scroll away. Users must scroll back to the top to search or switch tabs. The page title should hide on scroll down to reclaim space, but reappear on scroll up for quick access to the 3-dot menu.

## 2. Solution

A mobile-focused UX pass that removes the dual header, introduces a warm yellow brand colour, makes paint card actions larger and consistent, unifies filtering across tabs, and adds sticky scroll behaviour with an auto-hiding page title.

## 3. Scope

| This PRD covers | This PRD does NOT cover |
| --- | --- |
| Hide AppHeader on mobile (sm:hidden inverse) | Redesigning AppHeader for desktop |
| App-wide accent colour change (indigo → amber/yellow) | Per-component colour overrides |
| Larger check/heart icons with new colours | Changing the card layout or adding new actions |
| Consistent check + heart on all 3 paint tabs | Adding new tabs or changing tab semantics |
| Unified filter state across all tabs | Adding new filter types (range, colour family) |
| Sticky search bar + tab pills | Sticky behaviour on non-paint pages |
| Auto-hide/show page title on scroll (reusable composable) | Scroll-linked animations or parallax |
| Adjusting layout padding for mobile without AppHeader | Responsive breakpoint changes |

## 4. Architecture

### Component structure

```
app/
  composables/
    useScrollHeader.ts        ← NEW: reusable scroll-direction composable
  components/
    ui/
      AppHeader.vue           ← MODIFIED: hidden on mobile
    paint/
      PaintCardCompact.vue    ← MODIFIED: bigger icons, new colours
  layouts/
    default.vue               ← MODIFIED: mobile padding adjustment
  pages/
    paints/index.vue          ← MODIFIED: unified filter, sticky, scroll-hide, consistent buttons
  tailwind.config.ts          ← MODIFIED: accent palette swap
```

### Key components

**`useScrollHeader` composable (new)**
Tracks scroll direction and exposes `isHeaderVisible`. On scroll down past a threshold (~60px from top), hides. On any scroll up, shows immediately. Returns `{ isHeaderVisible: Ref<boolean> }`. Attaches/detaches window scroll listener via lifecycle hooks. Usable by any page — not paint-specific.

**`AppHeader.vue` (modified)**
Wrap the `<header>` element to be desktop-only. Mobile navigation is already served by BottomTabBar + ThreeDotMenu.

**`PaintCardCompact.vue` (modified)**
- Icons: w-5 h-5 → w-6 h-6 (24px, better touch target within existing w-11 h-11 button area)
- Check colour: emerald-500 → accent-500 (warm yellow)
- Heart colour: blue-500 → pink-300 (pastel pink, readable on white)

**`paints/index.vue` (modified)**
- Page title + 3-dot menu wrapped in a sticky, scroll-aware container using `useScrollHeader`
- Search bar + tab pills wrapped in a sticky container below the title
- Sticky top offset adjusts dynamically based on header visibility
- Filter state unified: remove `tabBrand` ref, use single `searchFilters.brand` for all tabs
- All three tab template blocks pass both `:is-owned` and `:is-wishlisted` props explicitly

**`tailwind.config.ts` (modified)**
Replace indigo accent palette with Tailwind's amber scale — a warm golden yellow that reads as "indian yellow."

**`default.vue` (modified)**
Remove top padding on mobile (no AppHeader to clear). Keep `sm:pt-8` for desktop.

### Data flow

No data model changes. All changes are presentation-layer:

```
User scrolls → useScrollHeader tracks direction → isHeaderVisible toggles
  → page title container translates up/down
  → sticky search/tabs adjusts top offset

User changes filter → searchFilters ref updates → all tabs read same state
  → catalog.filters synced when on All tab
  → Owned/Wishlist tabs filter client-side from same brand value
```

### Integration points

- `useScrollHeader` hooks into `window.scroll` — must clean up on unmount
- Filter unification removes the split between `catalog.filters.brand` and `tabBrand` — the `watch(activeTab)` handler syncs `searchFilters.brand` into `catalog.filters.brand` when switching to the All tab
- Accent palette change propagates automatically through all existing `accent-*` Tailwind classes (53+ usages across the app)

## 5. Success Metrics

| Metric | Target |
| --- | --- |
| Mobile vertical space saved | ~64px (AppHeader height removed) |
| Touch target icon size | 24px (up from 20px) within 44px hit area |
| Accent colour consistency | All `accent-*` usages render warm yellow, zero indigo remnants |
| Check + heart visible on all tabs | 3/3 tabs show both buttons on every card |
| Filter persistence across tabs | Brand + type + query persist when switching tabs |
| Sticky search/tabs | Search bar and tab pills remain visible during scroll |
| Page title auto-hide | Hides on scroll down, reappears within first few pixels of scroll up |

## 6. Out of Scope

- Desktop layout changes (AppHeader stays visible on sm: and above)
- New filter types (range, colour family, finish)
- Paint card layout redesign beyond icon size/colour
- Scheme or project page UX changes (they inherit the colour change automatically)
- Dark mode considerations
- Performance optimisation of scroll listeners (requestAnimationFrame throttling — add if needed)
- The deferred code simplification findings from prd-v4 (collapsing template blocks, extracting helpers) — natural to address during implementation but not the goal of this PRD

## User Flow

### Paints page on mobile (post-change)

```
Page loads → Title "My Paints" + 3-dot visible at top
           → Search bar below title
           → Tab pills (All / Owned / Wishlist) below search
           → Paint cards below tabs

User scrolls down → Title + 3-dot slides up and hides (transition 200ms)
                   → Search bar + tabs stick to top of viewport
                   → Cards continue scrolling beneath sticky area

User scrolls up (even slightly) → Title + 3-dot slides back down into view
                                 → Search bar + tabs shift down to make room

User changes brand filter on Owned tab → Switches to All tab
                                        → Same brand filter still active
                                        → Switches to Wishlist tab
                                        → Same brand filter still active

User taps check on any tab → Yellow filled check toggles owned status
User taps heart on any tab → Pastel pink filled heart toggles wishlist status
```
