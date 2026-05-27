import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,
  paints: defineTable({
    userId: v.optional(v.string()),
    brand: v.string(),
    name: v.string(),
    paintType: v.string(),
    hexColor: v.string(),
    status: v.string(),
    notes: v.union(v.string(), v.null()),
    transparency: v.union(v.string(), v.null()),
    finish: v.union(v.string(), v.null()),
    specialType: v.union(v.string(), v.null()),
    barcode: v.union(v.string(), v.null()),
    brandCode: v.union(v.string(), v.null()),
    catalogPaintId: v.optional(v.id('catalogPaints')),
  })
    .index('by_brand', ['brand'])
    .index('by_status', ['status'])
    .index('by_type', ['paintType'])
    .index('by_brand_code', ['brandCode'])
    .index('by_barcode', ['barcode'])
    .index('by_user', ['userId']),

  schemes: defineTable({
    userId: v.optional(v.string()),
    name: v.string(),
    description: v.union(v.string(), v.null()),
    isPublic: v.optional(v.boolean()),
    slug: v.optional(v.string()),
  }).index('by_user', ['userId']).index('by_slug', ['slug']),

  schemeSteps: defineTable({
    schemeId: v.id('schemes'),
    paintId: v.union(v.id('paints'), v.null()),
    sortOrder: v.number(),
    technique: v.string(),
    notes: v.union(v.string(), v.null()),
  }).index('by_scheme', ['schemeId']),

  projects: defineTable({
    userId: v.optional(v.string()),
    name: v.string(),
    description: v.union(v.string(), v.null()),
  }).index('by_user', ['userId']),

  projectSchemes: defineTable({
    projectId: v.id('projects'),
    schemeId: v.id('schemes'),
  })
    .index('by_project', ['projectId'])
    .index('by_scheme', ['schemeId']),

  projectPaints: defineTable({
    projectId: v.id('projects'),
    paintId: v.id('paints'),
  })
    .index('by_project', ['projectId'])
    .index('by_paint', ['paintId']),

  catalogPaints: defineTable({
    brand: v.string(),
    range: v.string(),
    rangeCode: v.string(),
    name: v.string(),
    brandCode: v.string(),
    hexColor: v.union(v.string(), v.null()),
    paintType: v.string(),
    finish: v.string(),
    transparency: v.string(),
    // optional: absent on static-seed entries (deduped by brandCode); present on
    // every OpenMiniPaints-synced entry. Convex cannot enforce uniqueness at the
    // DB level, so the sync action (T2) MUST query this index before inserting
    // to prevent silent duplicates.
    openMiniPaintsId: v.optional(v.string()),
    syncedAt: v.optional(v.number()),
  })
    .index('by_brand', ['brand'])
    .index('by_range', ['range'])
    .index('by_brand_code', ['brandCode'])
    .index('by_open_mini_paints_id', ['openMiniPaintsId'])
    .searchIndex('search_name', { searchField: 'name', filterFields: ['brand'] }),
})
