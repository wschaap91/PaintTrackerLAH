import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {
    brand: v.optional(v.string()),
    paintType: v.optional(v.string()),
    status: v.optional(v.string()),
    q: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let paints = await ctx.db.query('paints').collect()

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
    return await ctx.db.get(args.id)
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('paints', args)
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
    const { id, ...updates } = args
    await ctx.db.patch(id, updates)
  },
})

export const remove = mutation({
  args: { id: v.id('paints') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

export const lookup = query({
  args: {
    code: v.optional(v.string()),
    barcode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.code) {
      const normalized = args.code.trim().toLowerCase()
      const all = await ctx.db.query('paints').collect()
      const match = all.find(p => p.brandCode?.toLowerCase() === normalized)
      if (match) return match
    }
    if (args.barcode) {
      const all = await ctx.db.query('paints').collect()
      const match = all.find(p => p.barcode === args.barcode!.trim())
      if (match) return match
    }
    return null
  },
})
