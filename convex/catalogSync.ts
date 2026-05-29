import { internalMutation, internalAction, query } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { classifyColorFamily } from './colorFamily'

// Convex actions run in a custom environment without @types/node;
// declare process.env so TypeScript accepts it (available at runtime via Convex deployment env vars).
declare const process: { env: Record<string, string | undefined> }

// ---------------------------------------------------------------------------
// OpenMiniPaints API response shape
// ---------------------------------------------------------------------------

interface OpenMiniPaintsEntry {
  id: string
  brand: string
  range: string
  range_code: string
  name: string
  brand_code: string
  hex_color: string | null
  type: string
  finish: string
  transparency: string
  special_type?: string | null
  barcode?: string | null
}

interface OpenMiniPaintsPage {
  data: OpenMiniPaintsEntry[]
  next_cursor: string | null
}

// ---------------------------------------------------------------------------
// upsertCatalogPaint — internalMutation
// ---------------------------------------------------------------------------

export const upsertCatalogPaint = internalMutation({
  args: {
    openMiniPaintsId: v.string(),
    brand: v.string(),
    range: v.string(),
    rangeCode: v.string(),
    name: v.string(),
    brandCode: v.string(),
    hexColor: v.union(v.string(), v.null()),
    paintType: v.string(),
    finish: v.union(v.string(), v.null()),
    transparency: v.union(v.string(), v.null()),
    specialType: v.optional(v.union(v.string(), v.null())),
    barcode: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { openMiniPaintsId, ...fields } = args
    const colorFamily = classifyColorFamily(fields.hexColor, fields.finish)

    // Try to find existing row by openMiniPaintsId first
    const byId = await ctx.db
      .query('catalogPaints')
      .withIndex('by_open_mini_paints_id', q => q.eq('openMiniPaintsId', openMiniPaintsId))
      .first()

    if (byId) {
      await ctx.db.patch(byId._id, { openMiniPaintsId, ...fields, colorFamily, syncedAt: Date.now() })
      return
    }

    // Fallback: find by brand + brandCode (pre-sync seeded row without openMiniPaintsId)
    const byBrandCode = await ctx.db
      .query('catalogPaints')
      .withIndex('by_brand_code', q => q.eq('brandCode', fields.brandCode))
      .collect()

    const match = byBrandCode.find(row => row.brand === fields.brand)

    if (match) {
      // Backfill openMiniPaintsId and update all fields
      await ctx.db.patch(match._id, { openMiniPaintsId, ...fields, colorFamily, syncedAt: Date.now() })
      return
    }

    // No existing row — insert new
    await ctx.db.insert('catalogPaints', {
      openMiniPaintsId,
      ...fields,
      colorFamily,
      syncedAt: Date.now(),
    })
  },
})

// ---------------------------------------------------------------------------
// searchCatalog — public query (auth required)
// ---------------------------------------------------------------------------

export const searchCatalog = query({
  args: {
    q: v.string(),
    brand: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const rawLimit = args.limit ?? 10
    const limit = Math.max(1, Math.min(25, rawLimit))

    const results = await ctx.db
      .query('catalogPaints')
      .withSearchIndex('search_name', q => {
        const withText = q.search('name', args.q)
        return args.brand ? withText.eq('brand', args.brand) : withText
      })
      .take(limit)

    return results
  },
})

// ---------------------------------------------------------------------------
// lookupCatalogByCode — exact code/barcode lookup (auth required)
// ---------------------------------------------------------------------------

export const lookupCatalogByCode = query({
  args: {
    code: v.optional(v.string()),
    barcode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    if (args.code) {
      const result = await ctx.db
        .query('catalogPaints')
        .withIndex('by_brand_code', q => q.eq('brandCode', args.code!.trim()))
        .first()
      if (result) return result
    }

    if (args.barcode) {
      const result = await ctx.db
        .query('catalogPaints')
        .filter(q => q.eq(q.field('barcode'), args.barcode!.trim()))
        .first()
      if (result) return result
    }

    return null
  },
})

// ---------------------------------------------------------------------------
// getCatalogPaint — public query (auth required)
// ---------------------------------------------------------------------------

export const getCatalogPaint = query({
  args: { id: v.id('catalogPaints') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const doc = await ctx.db.get(args.id)
    return doc ?? null
  },
})

// ---------------------------------------------------------------------------
// syncCatalog — internalAction
// ---------------------------------------------------------------------------

export const syncCatalog = internalAction({
  args: {},
  handler: async (ctx): Promise<{ synced: number; errors: number }> => {
    const apiKey = process.env.OPEN_MINI_PAINTS_API_KEY
    const siteUrl = process.env.OPEN_MINI_PAINTS_SITE_URL

    if (!apiKey || !siteUrl) {
      return { synced: 0, errors: 1 }
    }

    let synced = 0
    let errors = 0

    try {
      let cursor: string | null = null

      do {
        const url = new URL(`${siteUrl}/api/paints`)
        if (cursor) url.searchParams.set('cursor', cursor)

        const response = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`syncCatalog: HTTP error ${response.status} from ${url.toString()}`)
          errors++
          break
        }

        const page = (await response.json()) as OpenMiniPaintsPage

        for (const entry of page.data) {
          try {
            await ctx.runMutation(internal.catalogSync.upsertCatalogPaint, {
              openMiniPaintsId: entry.id,
              brand: entry.brand,
              range: entry.range,
              rangeCode: entry.range_code,
              name: entry.name,
              brandCode: entry.brand_code,
              hexColor: entry.hex_color ?? null,
              paintType: entry.type,
              finish: entry.finish,
              transparency: entry.transparency,
              specialType: entry.special_type ?? null,
              barcode: entry.barcode ?? null,
            })
            synced++
          } catch (err) {
            console.error(`syncCatalog: failed to upsert entry ${entry.id}:`, err)
            errors++
          }
        }

        cursor = page.next_cursor
      } while (cursor !== null)
    } catch (err) {
      console.error('syncCatalog: pagination loop failed:', err)
      errors++
    }

    return { synced, errors }
  },
})

// ---------------------------------------------------------------------------
// backfillColorFamily — internalAction
// Iterates all catalogPaints rows missing colorFamily and patches them.
// Run once after deploying the schema update.
// ---------------------------------------------------------------------------

export const backfillColorFamily = internalAction({
  args: {},
  handler: async (ctx): Promise<{ patched: number }> => {
    // Fetch all rows without colorFamily in batches via a mutation so we
    // stay within Convex action limits. We delegate DB work to an internal
    // mutation to avoid direct DB access inside an action.
    const result = await ctx.runMutation(internal.catalogSync.backfillColorFamilyBatch, {})
    return result
  },
})

export const backfillColorFamilyBatch = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ patched: number }> => {
    // Convex mutations have a 8 MB / 4096 document read limit, so we fetch
    // all rows and patch only those missing colorFamily. For large catalogs
    // this may need to be chunked — acceptable for a one-shot backfill.
    const rows = await ctx.db.query('catalogPaints').collect()
    let patched = 0

    for (const row of rows) {
      if (row.colorFamily !== undefined) continue

      const colorFamily = classifyColorFamily(row.hexColor, row.finish ?? null)
      await ctx.db.patch(row._id, { colorFamily })
      patched++
    }

    return { patched }
  },
})
