---
version: 7
status: built
date: 2026-05-29
author: Wouter Schaap
previous: prd-v6.md
---

# PaintTrackerLAH — Army Painter Range Normalization

## 1. Problem

Army Painter paints store the product range as part of the paint name (e.g., `"Warpaints Fanatic: Matt White"` instead of `"Matt White"` with range `"Warpaints Fanatic"`). This is the only brand with this problem — Citadel, Vallejo, AK Interactive, and Kimera all have clean, range-free names.

The issue exists at two levels:

**Scraper/seed data.** The Army Painter scraper in OpenMiniPaints produces names like `"Warpaints Fanatic Effects: Plasma Coil Glow"`. The `Paint` interface in `_common.ts` has no `range` field, so range info can only live in the name. There are 250 scraped paints across 8 range prefixes: Warpaints Fanatic (162), Warpaints Fanatic Metallic (18), Warpaints Fanatic Effects (18), Warpaints Fanatic Wash (17), John Blanche Masterclass (16), Flexible Triad (14), Historical (4).

**Downstream data.** When users add Army Painter paints from the catalog, the owned paint's `name` field carries the range prefix too. Search, display, and scheme steps all show `"Warpaints Fanatic: Matt White"` instead of just `"Matt White"`. The catalog search index searches within the name field, so searching for `"Matt White"` requires the user to know the prefix isn't part of the actual paint name.

The PaintTrackerLAH `catalogPaints` schema already has proper `range` and `rangeCode` fields, and the OpenMiniPaints API sync fills them correctly. But seed/scraper-originated rows may have range baked into the name and incorrect `paintType` values (e.g., `"warpaints-fanatic"` conflates range with type).

## 2. Solution

Fix the Army Painter scraper to extract range prefixes from paint names, add a `range` field to the common `Paint` interface, correct `paintType` values to use generic paint classifications, and write a Convex migration to clean up existing `catalogPaints` rows that have range info embedded in their names.

## 3. Scope

| This PRD covers | This PRD does NOT cover |
|---|---|
| Army Painter scraper range extraction | Other brand scraper improvements |
| `Paint` interface `range` field addition | Full range normalization for all brands |
| `paintType` correction for Army Painter | Reclassifying `paintType` across all brands |
| Migration for existing `catalogPaints` rows | Migration for user-owned `paints` rows |
| OpenMiniPaints `admin:bulkImport` range support | Changes to the OpenMiniPaints API sync path |

## 4. Architecture

### Modified files

```
OpenMiniPaints/
  scripts/scrape/
    _common.ts              # Add range field to Paint interface
    army-painter.ts         # Extract range from name, set proper paintType
  convex/
    admin.ts                # Accept range in bulkImport, pass to catalogPaints
    schema.ts               # Add range field to catalogPaints (OpenMiniPaints schema)

convex/
  migrations.ts             # Add migration to strip range prefixes from existing catalogPaints names
```

### Key components

**Range extraction logic (army-painter.ts).** Parse the `"<Range>: <Name>"` pattern from Shopify product titles and seed data. Known range prefixes: `Warpaints Fanatic`, `Warpaints Fanatic Metallic`, `Warpaints Fanatic Effects`, `Warpaints Fanatic Wash`, `John Blanche Masterclass`, `Flexible Triad`, `Historical`. The colon-space (`: `) separator is the parsing boundary.

**paintType correction.** Current values `"warpaints-fanatic"` and `"speedpaint"` conflate range with type. These should map to generic classifications:
- Warpaints Fanatic → `"acrylic"`
- Warpaints Fanatic Metallic → `"metallic"`
- Warpaints Fanatic Effects → `"effects"`
- Warpaints Fanatic Wash → `"wash"`
- Speedpaint 2.0 → `"speedpaint"` (this one is genuinely a paint type)
- John Blanche Masterclass → derive from content (acrylic/wash/metallic)
- Flexible Triad → `"set"` (these are paint sets, not individual paints)

**Data migration (migrations.ts).** A Convex internalMutation that iterates `catalogPaints` rows where `brand === "Army Painter"` and strips known range prefixes from the `name` field. Should also backfill the `range` field if empty and correct `paintType` values.

### Data flow

```
Shopify API / Seed data
  → army-painter.ts (extract range, clean name, set paintType)
  → data/scraped/army-painter.json (clean data with range field)
  → import.ts → admin:bulkImport (upsert with range)
  → catalogPaints table (clean name, proper range, correct paintType)
```

### Integration points

- `catalogSync.ts` `addFromCatalog` mutation — copies `name` from catalog to owned paint. After this fix, new catalog adds will get clean names automatically.
- `useCatalogBrowse` composable — already supports range filtering; will show cleaner names.
- `CatalogFilters` component — no changes needed; already has range filter UI.
- `search_name` searchIndex — will search cleaner names, improving search relevance.

## 5. Success Metrics

| Metric | Target |
|---|---|
| Army Painter catalog paint names contain no range prefix | 0 names with `: ` pattern after migration |
| Range field populated for all Army Painter catalog rows | 100% coverage |
| paintType values use generic classifications | No `"warpaints-fanatic"` values remain |
| Existing search and browse functionality unbroken | All catalog queries return expected results |

## 6. Out of Scope

- Cleaning up user-owned `paints` table rows that inherited range-in-name from catalog adds (would require user notification / consent)
- Vallejo range normalization (range is in `brandCode`, not `name` — different problem)
- Adding range support to other brand scrapers (they don't need it)
- Changes to the OpenMiniPaints API sync path (it already provides clean range data)
- UI changes to display range separately from name (already works via `CatalogPaintCard`)

## Dependencies & Risks

| Dependency/Risk | Impact | Mitigation |
|---|---|---|
| OpenMiniPaints `admin:bulkImport` schema change | Breaking if deployed before code | Deploy code changes before re-importing data |
| Existing catalog-linked paints reference old names | User confusion if catalog name changes but owned paint name doesn't | Out of scope — owned paints keep their names |
| Edge case: paint names that happen to contain `: ` | False positive range extraction | Only strip known prefixes, don't generically split on `: ` |
| Flexible Triad and paint sets in catalog | These are sets, not individual paints | Mark with `paintType: "set"` but keep in catalog |

## Rollback Plan

The migration is data-only and idempotent. If range extraction produces incorrect results, re-run the OpenMiniPaints API sync (`syncCatalog`) which will overwrite with clean API data. The scraper changes are in the OpenMiniPaints repo and don't affect runtime.
