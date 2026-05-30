import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import type { Id } from './_generated/dataModel'
import { getAuthUserId } from './lib'

const stepSchema = v.object({
  paintId: v.union(v.id('paints'), v.null()),
  technique: v.string(),
  notes: v.union(v.string(), v.null()),
  areaIndex: v.optional(v.union(v.number(), v.null())),
})

const areaSchema = v.object({ name: v.string(), sortOrder: v.number() })

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const schemes = await ctx.db
      .query('schemes')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect()

    const result = await Promise.all(
      schemes.map(async (scheme) => {
        const steps = await ctx.db
          .query('schemeSteps')
          .withIndex('by_scheme', q => q.eq('schemeId', scheme._id))
          .collect()

        const sortedSteps = steps.sort((a, b) => a.sortOrder - b.sortOrder)

        const swatches = await Promise.all(
          sortedSteps.map(async (s) => {
            if (!s.paintId) return null
            const paint = await ctx.db.get(s.paintId)
            return paint?.hexColor ?? null
          }),
        )

        return {
          ...scheme,
          stepCount: steps.length,
          swatches: swatches.filter(Boolean) as string[],
        }
      }),
    )

    return result.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export const get = query({
  args: { id: v.id('schemes') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const scheme = await ctx.db.get(args.id)
    if (!scheme || scheme.userId !== userId) return null

    const areas = await ctx.db
      .query('schemeAreas')
      .withIndex('by_scheme', q => q.eq('schemeId', args.id))
      .collect()
    const sortedAreas = areas.sort((a, b) => a.sortOrder - b.sortOrder)

    const steps = await ctx.db
      .query('schemeSteps')
      .withIndex('by_scheme', q => q.eq('schemeId', args.id))
      .collect()

    const sortedSteps = steps.sort((a, b) => a.sortOrder - b.sortOrder)

    const stepsWithPaints = await Promise.all(
      sortedSteps.map(async (step) => {
        const paint = step.paintId ? await ctx.db.get(step.paintId) : null
        return { ...step, paint }
      }),
    )

    return {
      ...scheme,
      areas: sortedAreas.map(a => ({ _id: a._id, name: a.name, sortOrder: a.sortOrder })),
      steps: stepsWithPaints,
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.union(v.string(), v.null()),
    steps: v.array(stepSchema),
    areas: v.optional(v.array(areaSchema)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const schemeId = await ctx.db.insert('schemes', {
      userId,
      name: args.name,
      description: args.description,
    })

    const areaIdMap = new Map<number, Id<'schemeAreas'>>()
    if (args.areas) {
      for (let i = 0; i < args.areas.length; i++) {
        const area = args.areas[i]!
        const areaId = await ctx.db.insert('schemeAreas', {
          schemeId,
          name: area.name,
          sortOrder: area.sortOrder,
        })
        areaIdMap.set(i, areaId)
      }
    }

    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i]!
      const areaId =
        step.areaIndex != null ? areaIdMap.get(step.areaIndex) : undefined
      await ctx.db.insert('schemeSteps', {
        schemeId,
        paintId: step.paintId,
        sortOrder: i,
        technique: step.technique,
        notes: step.notes,
        ...(areaId !== undefined ? { areaId } : {}),
      })
    }

    return schemeId
  },
})

export const update = mutation({
  args: {
    id: v.id('schemes'),
    name: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    steps: v.optional(v.array(stepSchema)),
    areas: v.optional(v.array(areaSchema)),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const scheme = await ctx.db.get(args.id)
    if (!scheme || scheme.userId !== userId) throw new Error('Not found or forbidden')

    const { id, steps, areas, ...rest } = args

    if (rest.name !== undefined || rest.description !== undefined) {
      await ctx.db.patch(id, rest)
    }

    const areaIdMap = new Map<number, Id<'schemeAreas'>>()

    if (areas !== undefined) {
      const existingAreas = await ctx.db
        .query('schemeAreas')
        .withIndex('by_scheme', q => q.eq('schemeId', id))
        .collect()
      for (const a of existingAreas) {
        await ctx.db.delete(a._id)
      }

      for (let i = 0; i < areas.length; i++) {
        const area = areas[i]!
        const areaId = await ctx.db.insert('schemeAreas', {
          schemeId: id,
          name: area.name,
          sortOrder: area.sortOrder,
        })
        areaIdMap.set(i, areaId)
      }
    }

    if (steps !== undefined) {
      const existingSteps = await ctx.db
        .query('schemeSteps')
        .withIndex('by_scheme', q => q.eq('schemeId', id))
        .collect()
      for (const s of existingSteps) {
        await ctx.db.delete(s._id)
      }

      if (areas === undefined) {
        const existingAreas = await ctx.db
          .query('schemeAreas')
          .withIndex('by_scheme', q => q.eq('schemeId', id))
          .collect()
        const sortedAreas = existingAreas.sort((a, b) => a.sortOrder - b.sortOrder)
        for (let i = 0; i < sortedAreas.length; i++) {
          areaIdMap.set(i, sortedAreas[i]!._id)
        }
      }

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]!
        const areaId =
          step.areaIndex != null ? areaIdMap.get(step.areaIndex) : undefined
        await ctx.db.insert('schemeSteps', {
          schemeId: id,
          paintId: step.paintId,
          sortOrder: i,
          technique: step.technique,
          notes: step.notes,
          ...(areaId !== undefined ? { areaId } : {}),
        })
      }
    } else if (areas !== undefined) {
      const existingSteps = await ctx.db
        .query('schemeSteps')
        .withIndex('by_scheme', q => q.eq('schemeId', id))
        .collect()
      for (const step of existingSteps) {
        if (step.areaId !== undefined) {
          await ctx.db.patch(step._id, { areaId: undefined })
        }
      }
    }
  },
})

export const getPublicScheme = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const scheme = await ctx.db
      .query('schemes')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .first()

    if (!scheme || !scheme.isPublic) return null

    const areas = await ctx.db
      .query('schemeAreas')
      .withIndex('by_scheme', q => q.eq('schemeId', scheme._id))
      .collect()
    const sortedAreas = areas.sort((a, b) => a.sortOrder - b.sortOrder)

    const steps = await ctx.db
      .query('schemeSteps')
      .withIndex('by_scheme', q => q.eq('schemeId', scheme._id))
      .collect()

    const sortedSteps = steps.sort((a, b) => a.sortOrder - b.sortOrder)

    const stepsWithPaints = await Promise.all(
      sortedSteps.map(async (step) => {
        const rawPaint = step.paintId ? await ctx.db.get(step.paintId) : null
        const paint = rawPaint ? { name: rawPaint.name, brand: rawPaint.brand, hexColor: rawPaint.hexColor } : null
        return {
          _id: step._id,
          technique: step.technique,
          notes: step.notes,
          areaId: step.areaId,
          paint,
        }
      }),
    )

    const user = scheme.userId ? await ctx.db.get(scheme.userId as Id<'users'>) : null
    const authorName = user?.name ?? 'A PaintTracker user'

    return {
      _id: scheme._id,
      _creationTime: scheme._creationTime,
      name: scheme.name,
      description: scheme.description,
      slug: scheme.slug,
      isPublic: scheme.isPublic,
      authorName,
      areas: sortedAreas.map(a => ({ _id: a._id, name: a.name, sortOrder: a.sortOrder })),
      steps: stepsWithPaints,
    }
  },
})

export const setPublic = mutation({
  args: {
    id: v.id('schemes'),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const scheme = await ctx.db.get(args.id)
    if (!scheme || scheme.userId !== userId) throw new Error('Not found or forbidden')

    let slug = scheme.slug
    if (args.isPublic && !slug) {
      const base = scheme.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40)
      const { nanoid } = await import('nanoid')
      slug = `${base}-${nanoid(6)}`
    }

    await ctx.db.patch(args.id, { isPublic: args.isPublic, slug })
    return slug
  },
})

export const listPublicSchemes = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal('recent'), v.literal('popular'))),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 24
    const offset = args.offset ?? 0
    const sortBy = args.sortBy ?? 'recent'

    const allSchemes = await ctx.db.query('schemes').collect()
    const publicSchemes = allSchemes.filter(s => s.isPublic === true && s.slug)

    // Enrich with step data
    const enriched = await Promise.all(
      publicSchemes.map(async (scheme) => {
        const steps = await ctx.db
          .query('schemeSteps')
          .withIndex('by_scheme', q => q.eq('schemeId', scheme._id))
          .collect()

        const sortedSteps = steps.sort((a, b) => a.sortOrder - b.sortOrder)

        const swatches: string[] = []
        const techniques = new Set<string>()

        for (const step of sortedSteps) {
          techniques.add(step.technique)
          if (step.paintId && swatches.length < 5) {
            const paint = await ctx.db.get(step.paintId)
            if (paint) swatches.push(paint.hexColor)
          }
        }

        return {
          ...scheme,
          stepCount: steps.length,
          swatches,
          techniques: Array.from(techniques),
        }
      }),
    )

    // Sort
    const sorted = enriched.sort((a, b) => {
      if (sortBy === 'popular') return b.stepCount - a.stepCount
      return b._creationTime - a._creationTime
    })

    // Paginate
    const page = sorted.slice(offset, offset + limit)
    const hasMore = sorted.length > offset + limit

    return { schemes: page, hasMore, total: sorted.length }
  },
})

export const cloneScheme = mutation({
  args: { schemeId: v.id('schemes') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const source = await ctx.db.get(args.schemeId)
    if (!source || !source.isPublic) throw new Error('Scheme not found or not public')

    const newSchemeId = await ctx.db.insert('schemes', {
      userId,
      name: `${source.name} (copy)`,
      description: source.description,
      isPublic: false,
    })

    const sourceAreas = await ctx.db
      .query('schemeAreas')
      .withIndex('by_scheme', q => q.eq('schemeId', args.schemeId))
      .collect()

    const areaIdMap = new Map<Id<'schemeAreas'>, Id<'schemeAreas'>>()
    for (const area of sourceAreas) {
      const newAreaId = await ctx.db.insert('schemeAreas', {
        schemeId: newSchemeId,
        name: area.name,
        sortOrder: area.sortOrder,
      })
      areaIdMap.set(area._id, newAreaId)
    }

    const steps = await ctx.db
      .query('schemeSteps')
      .withIndex('by_scheme', q => q.eq('schemeId', args.schemeId))
      .collect()

    const sortedSteps = steps.sort((a, b) => a.sortOrder - b.sortOrder)
    for (let i = 0; i < sortedSteps.length; i++) {
      const step = sortedSteps[i]!
      const areaId = step.areaId ? areaIdMap.get(step.areaId) : undefined
      await ctx.db.insert('schemeSteps', {
        schemeId: newSchemeId,
        paintId: step.paintId,
        sortOrder: i,
        technique: step.technique,
        notes: step.notes,
        ...(areaId !== undefined ? { areaId } : {}),
      })
    }

    return newSchemeId
  },
})

export const remove = mutation({
  args: { id: v.id('schemes') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const scheme = await ctx.db.get(args.id)
    if (!scheme || scheme.userId !== userId) throw new Error('Not found or forbidden')

    const steps = await ctx.db
      .query('schemeSteps')
      .withIndex('by_scheme', q => q.eq('schemeId', args.id))
      .collect()
    for (const s of steps) {
      await ctx.db.delete(s._id)
    }

    const areas = await ctx.db
      .query('schemeAreas')
      .withIndex('by_scheme', q => q.eq('schemeId', args.id))
      .collect()
    for (const a of areas) {
      await ctx.db.delete(a._id)
    }

    const projectLinks = await ctx.db
      .query('projectSchemes')
      .withIndex('by_scheme', q => q.eq('schemeId', args.id))
      .collect()
    for (const link of projectLinks) {
      await ctx.db.delete(link._id)
    }

    await ctx.db.delete(args.id)
  },
})
