# ADR-009: Warm amber accent palette replacing indigo

- **Status:** Accepted
- **Date:** 2026-06-01
- **Deciders:** Wouter Schaap

---

## Context

The app uses Tailwind's indigo scale as its custom `accent` colour palette (defined in `tailwind.config.ts`). This purple/indigo identity doesn't fit the miniature painting domain. A warm, golden colour closer to "indian yellow" better reflects the craft. The palette is referenced in 53+ places across the app via `accent-*` utility classes (focus rings, active states, CTAs, nav highlights), so the change propagates app-wide from a single config edit.

## Decision

Replace the `accent` palette in `tailwind.config.ts` with **Tailwind's amber scale** — a warm golden yellow ranging from `#fffbeb` (50) to `#78350f` (900).

```ts
accent: {
  50:  '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
}
```

## Alternatives rejected

- **Custom hand-picked yellow palette** — more control over individual shades, but unnecessary work when Tailwind's amber scale already reads as warm indian yellow and has proven contrast ratios across the range.
- **Orange (Tailwind orange scale)** — too aggressive and reads as "warning" in UI conventions. Amber is warmer and more neutral.
- **Keep indigo, add yellow as secondary** — introduces a second palette to manage. The goal is to replace the brand identity, not layer on top.

## Consequences

- **Reduced contrast on white backgrounds** — amber-500 on white (#f59e0b on #fff) has a contrast ratio of ~2.1:1, below WCAG AA for text. Active states must use amber-600 (#d97706, ~3.4:1) or darker for text-on-white. Focus rings and filled backgrounds are unaffected (no text contrast requirement).
- **All existing `accent-*` usages change simultaneously** — buttons, links, tabs, focus rings, nav highlights. No incremental rollout possible.
- **Constrains future UI additions** — new components must use the amber palette, and designers must be aware of the contrast limitations for light shades on white.

## Scope

`tailwind.config.ts`, all files using `accent-*` classes (53+ usages across `app/components/`, `app/pages/`)

## Revisit when

A brand redesign is requested, or WCAG AA compliance for text elements becomes a hard requirement (amber-500 fails AA for normal text on white).
