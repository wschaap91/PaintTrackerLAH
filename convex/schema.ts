import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,
  paints: defineTable({
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
  })
    .index('by_brand', ['brand'])
    .index('by_status', ['status'])
    .index('by_type', ['paintType'])
    .index('by_brand_code', ['brandCode'])
    .index('by_barcode', ['barcode']),

  schemes: defineTable({
    name: v.string(),
    description: v.union(v.string(), v.null()),
  }),

  schemeSteps: defineTable({
    schemeId: v.id('schemes'),
    paintId: v.union(v.id('paints'), v.null()),
    sortOrder: v.number(),
    technique: v.string(),
    notes: v.union(v.string(), v.null()),
  }).index('by_scheme', ['schemeId']),

  projects: defineTable({
    name: v.string(),
    description: v.union(v.string(), v.null()),
  }),

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
})
