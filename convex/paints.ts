import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from './lib'

export const list = query({
  args: {
    brand: v.optional(v.string()),
    paintType: v.optional(v.string()),
    status: v.optional(v.string()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    let paints = await ctx.db
      .query('paints')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect()

    if (args.brand) paints = paints.filter(p => p.brand === args.brand)
    if (args.paintType) paints = paints.filter(p => p.paintType === args.paintType)
    if (args.status) paints = paints.filter(p => p.status === args.status)
    if (args.q) {
      const q = args.q.toLowerCase()
      paints = paints.filter(p =>
        p.name.toLowerCase().includes(q)
        || p.brand.toLowerCase().includes(q)
        || (p.brandCode?.toLowerCase().includes(q) ?? false),
      )
    }

    return paints.sort((a, b) => {
      const brandCmp = a.brand.localeCompare(b.brand)
      return brandCmp !== 0 ? brandCmp : a.name.localeCompare(b.name)
    })
  },
})

export const get = query({
  args: { id: v.id('paints') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const paint = await ctx.db.get(args.id)
    if (!paint || paint.userId !== userId) return null
    return paint
  },
})

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')
    return await ctx.db.insert('paints', { ...args, userId })
  },
})

export const update = mutation({
  args: {
    id: v.id('paints'),
    brand: v.optional(v.string()),
    name: v.optional(v.string()),
    paintType: v.optional(v.string()),
    hexColor: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.union(v.string(), v.null())),
    transparency: v.optional(v.union(v.string(), v.null())),
    finish: v.optional(v.union(v.string(), v.null())),
    specialType: v.optional(v.union(v.string(), v.null())),
    barcode: v.optional(v.union(v.string(), v.null())),
    brandCode: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')
    const { id, ...updates } = args
    const paint = await ctx.db.get(id)
    if (!paint || paint.userId !== userId) throw new Error('Not found or forbidden')
    await ctx.db.patch(id, updates)
  },
})

export const remove = mutation({
  args: { id: v.id('paints') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')
    const paint = await ctx.db.get(args.id)
    if (!paint || paint.userId !== userId) throw new Error('Not found or forbidden')
    await ctx.db.delete(args.id)
  },
})

export const bulkCreate = mutation({
  args: {
    paints: v.array(v.object({
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
    })),
    onDuplicate: v.union(v.literal('skip'), v.literal('update')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const existingPaints = await ctx.db
      .query('paints')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect()

    // Build a brand+name lookup map
    const existingMap = new Map(
      existingPaints.map(p => [`${p.brand.toLowerCase()}|${p.name.toLowerCase()}`, p])
    )

    let added = 0, skipped = 0, updated = 0

    for (const paint of args.paints) {
      const key = `${paint.brand.toLowerCase()}|${paint.name.toLowerCase()}`
      const existingPaint = existingMap.get(key)

      if (existingPaint) {
        if (args.onDuplicate === 'update') {
          await ctx.db.patch(existingPaint._id, paint)
          updated++
        } else {
          skipped++
        }
      } else {
        await ctx.db.insert('paints', { ...paint, userId })
        added++
      }
    }

    return { added, skipped, updated }
  },
})

export const listOwnedCatalogIds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const paints = await ctx.db
      .query('paints')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect()

    return paints
      .map(p => p.catalogPaintId)
      .filter((id): id is NonNullable<typeof id> => id != null)
  },
})

export const lookup = query({
  args: {
    code: v.optional(v.string()),
    barcode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    if (args.code) {
      const normalized = args.code.trim().toLowerCase()
      const all = await ctx.db
        .query('paints')
        .withIndex('by_user', q => q.eq('userId', userId))
        .collect()
      const match = all.find(p => p.brandCode?.toLowerCase() === normalized)
      if (match) return match
    }
    if (args.barcode) {
      const all = await ctx.db
        .query('paints')
        .withIndex('by_user', q => q.eq('userId', userId))
        .collect()
      const match = all.find(p => p.barcode === args.barcode!.trim())
      if (match) return match
    }
    return null
  },
})

export const listDistinctBrands = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []
    const paints = await ctx.db.query('paints').withIndex('by_user', q => q.eq('userId', userId)).collect()
    return Array.from(new Set(paints.map(p => p.brand))).sort()
  },
})

const SHOPPING_LIST_STATUSES = new Set(['wishlist', 'running_low', 'empty'])

export const getShoppingList = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const paints = await ctx.db
      .query('paints')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect()

    return paints
      .filter(p => SHOPPING_LIST_STATUSES.has(p.status))
      .sort((a, b) => {
        const brandCmp = a.brand.localeCompare(b.brand)
        return brandCmp !== 0 ? brandCmp : a.name.localeCompare(b.name)
      })
      .map(p => ({
        _id: p._id,
        status: p.status,
        brand: p.brand,
        name: p.name,
        hexColor: p.hexColor,
        brandCode: p.brandCode,
        paintType: p.paintType,
      }))
  },
})

export const getPublicShoppingList = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_shopping_list_slug', q => q.eq('shoppingListSlug', args.slug))
      .unique()

    if (!settings || !settings.shoppingListPublic) return null

    const paints = await ctx.db
      .query('paints')
      .withIndex('by_user', q => q.eq('userId', settings.userId))
      .collect()

    const items = paints
      .filter(p => SHOPPING_LIST_STATUSES.has(p.status))
      .sort((a, b) => {
        const brandCmp = a.brand.localeCompare(b.brand)
        return brandCmp !== 0 ? brandCmp : a.name.localeCompare(b.name)
      })
      .map(p => ({
        _id: p._id,
        status: p.status,
        brand: p.brand,
        name: p.name,
        hexColor: p.hexColor,
        brandCode: p.brandCode,
        paintType: p.paintType,
      }))

    return { items }
  },
})

export const setShoppingListPublic = mutation({
  args: { isPublic: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const existing = await ctx.db
      .query('userSettings')
      .withIndex('by_user', q => q.eq('userId', userId))
      .unique()

    let slug = existing?.shoppingListSlug

    if (args.isPublic && !slug) {
      const { nanoid } = await import('nanoid')
      slug = `shopping-list-${nanoid(6)}`
    }

    if (existing) {
      await ctx.db.patch(existing._id, { shoppingListPublic: args.isPublic, shoppingListSlug: slug })
    } else {
      await ctx.db.insert('userSettings', {
        userId,
        shoppingListPublic: args.isPublic,
        shoppingListSlug: slug,
      })
    }

    return slug ?? null
  },
})

export const getUserShoppingSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const settings = await ctx.db
      .query('userSettings')
      .withIndex('by_user', q => q.eq('userId', userId))
      .unique()

    if (!settings) return null

    return {
      shoppingListPublic: settings.shoppingListPublic,
      shoppingListSlug: settings.shoppingListSlug,
    }
  },
})
