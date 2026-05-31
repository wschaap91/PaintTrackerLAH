import { internalMutation, internalAction, query, mutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { classifyColorFamily } from './colorFamily'
import { getAuthUserId } from './lib'

// Convex actions run in a custom environment without @types/node;
// declare process.env so TypeScript accepts it (available at runtime via Convex deployment env vars).
declare const process: { env: Record<string, string | undefined> }

// ---------------------------------------------------------------------------
// OpenMiniPaints API response shape
// ---------------------------------------------------------------------------

interface OpenMiniPaintsEntry {
  _id: string
  brand: string
  name: string
  range?: string
  rangeCode?: string
  paintType: string
  hexColor?: string | null
  brandCode?: string
  barcode?: string | null
  transparency?: string | null
  finish?: string | null
  specialType?: string | null
  imageUrl?: string | null
}

interface OpenMiniPaintsPage {
  results: OpenMiniPaintsEntry[]
  total: number
  cursor?: string | null
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
    range: v.optional(v.string()),
    colorFamily: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const rawLimit = args.limit ?? 10
    const limit = Math.max(1, Math.min(100, rawLimit))

    const results = await ctx.db
      .query('catalogPaints')
      .withSearchIndex('search_name', q => {
        let sq = q.search('name', args.q)
        if (args.brand) sq = sq.eq('brand', args.brand)
        if (args.range) sq = sq.eq('range', args.range)
        if (args.colorFamily) sq = sq.eq('colorFamily', args.colorFamily)
        return sq
      })
      .take(limit)

    return results
  },
})

// ---------------------------------------------------------------------------
// browseCatalog — paginated catalog browsing (auth required)
// ---------------------------------------------------------------------------

export const browseCatalog = query({
  args: {
    brand: v.optional(v.string()),
    range: v.optional(v.string()),
    colorFamily: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    let dbQuery
    if (args.brand && args.range) {
      dbQuery = ctx.db
        .query('catalogPaints')
        .withIndex('by_brand_range', q =>
          q.eq('brand', args.brand!).eq('range', args.range!),
        )
    } else if (args.brand) {
      dbQuery = ctx.db
        .query('catalogPaints')
        .withIndex('by_brand_range', q => q.eq('brand', args.brand!))
    } else {
      dbQuery = ctx.db.query('catalogPaints')
    }

    if (args.colorFamily) {
      dbQuery = dbQuery.filter(q => q.eq(q.field('colorFamily'), args.colorFamily!))
    }

    return await dbQuery.paginate(args.paginationOpts)
  },
})

// ---------------------------------------------------------------------------
// addFromCatalog — create owned paint from catalog entry (auth required)
// ---------------------------------------------------------------------------

export const addFromCatalog = mutation({
  args: {
    catalogPaintId: v.id('catalogPaints'),
    status: v.optional(v.union(v.literal('owned'), v.literal('wishlist'))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const catalogPaint = await ctx.db.get(args.catalogPaintId)
    if (!catalogPaint) throw new Error(`Catalog paint ${args.catalogPaintId} not found`)

    // Check for duplicate: user already owns a paint linked to this catalog entry
    const existing = await ctx.db
      .query('paints')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('catalogPaintId'), args.catalogPaintId))
      .first()

    if (existing) {
      throw new Error(
        `You already own "${catalogPaint.brand} ${catalogPaint.name}" (added as "${existing.name}"). ` +
          `To add a second pot, use the manual add form.`,
      )
    }

    return await ctx.db.insert('paints', {
      userId,
      brand: catalogPaint.brand,
      name: catalogPaint.name,
      paintType: catalogPaint.paintType,
      hexColor: catalogPaint.hexColor ?? '#888888',
      status: args.status ?? 'owned',
      notes: null,
      transparency: catalogPaint.transparency ?? null,
      finish: catalogPaint.finish ?? null,
      specialType: catalogPaint.specialType ?? null,
      barcode: catalogPaint.barcode ?? null,
      brandCode: catalogPaint.brandCode,
      catalogPaintId: args.catalogPaintId,
    })
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
// listCatalogRanges — distinct range values, optionally filtered by brand (auth required)
// ---------------------------------------------------------------------------

export const listCatalogRanges = query({
  args: {
    brand: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string[]> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const rangeSet = new Set<string>()

    if (args.brand) {
      // Use by_brand_range index to efficiently scan only the given brand
      const rows = await ctx.db
        .query('catalogPaints')
        .withIndex('by_brand_range', q => q.eq('brand', args.brand!))
        .collect()
      for (const row of rows) {
        if (row.range) rangeSet.add(row.range)
      }
    } else {
      const rows = await ctx.db.query('catalogPaints').collect()
      for (const row of rows) {
        if (row.range) rangeSet.add(row.range)
      }
    }

    return Array.from(rangeSet).sort()
  },
})

// ---------------------------------------------------------------------------
// listCatalogBrands — distinct brand values sorted alphabetically (auth required)
// ---------------------------------------------------------------------------

export const listCatalogBrands = query({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const all = await ctx.db.query('catalogPaints').collect()
    return Array.from(new Set(all.map(p => p.brand))).sort()
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
      let cursor: string | undefined = undefined

      do {
        const url = new URL(`${siteUrl}/paints`)
        if (cursor) url.searchParams.set('cursor', cursor)

        const response = await fetch(url.toString(), {
          headers: {
            'x-api-key': apiKey,
          },
        })

        if (!response.ok) {
          console.error(`syncCatalog: HTTP error ${response.status} from ${url.toString()}`)
          errors++
          break
        }

        const page = (await response.json()) as OpenMiniPaintsPage

        for (const entry of page.results) {
          try {
            await ctx.runMutation(internal.catalogSync.upsertCatalogPaint, {
              openMiniPaintsId: entry._id,
              brand: entry.brand,
              range: entry.range ?? '',
              rangeCode: entry.rangeCode ?? '',
              name: entry.name,
              brandCode: entry.brandCode ?? '',
              hexColor: entry.hexColor ?? null,
              paintType: entry.paintType,
              finish: entry.finish ?? null,
              transparency: entry.transparency ?? null,
              specialType: entry.specialType ?? null,
              barcode: entry.barcode ?? null,
            })
            synced++
          } catch (err) {
            console.error(`syncCatalog: failed to upsert entry ${entry._id}:`, err)
            errors++
          }
        }

        cursor = page.cursor ?? undefined
      } while (cursor !== undefined)
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
    let cursor: string | null = null
    let totalPatched = 0

    do {
      const result: { patched: number; cursor: string | null; isDone: boolean } =
        await ctx.runMutation(internal.catalogSync.backfillColorFamilyBatch, { cursor })
      totalPatched += result.patched
      cursor = result.isDone ? null : result.cursor
    } while (cursor !== null)

    return { patched: totalPatched }
  },
})

export const backfillColorFamilyBatch = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args): Promise<{ patched: number; cursor: string | null; isDone: boolean }> => {
    const BATCH_SIZE = 100

    const page = await ctx.db
      .query('catalogPaints')
      .paginate({ cursor: args.cursor, numItems: BATCH_SIZE })

    let patched = 0

    for (const row of page.page) {
      if (row.colorFamily !== undefined) continue

      const colorFamily = classifyColorFamily(row.hexColor, row.finish ?? null)
      await ctx.db.patch(row._id, { colorFamily })
      patched++
    }

    return {
      patched,
      cursor: page.isDone ? null : page.continueCursor,
      isDone: page.isDone,
    }
  },
})
