import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

const stepSchema = v.object({
  paintId: v.union(v.id('paints'), v.null()),
  technique: v.string(),
  notes: v.union(v.string(), v.null()),
})

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const schemes = await ctx.db
      .query('schemes')
      .withIndex('by_user', q => q.eq('userId', identity.subject))
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
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const scheme = await ctx.db.get(args.id)
    if (!scheme || scheme.userId !== identity.subject) return null

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

    return { ...scheme, steps: stepsWithPaints }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.union(v.string(), v.null()),
    steps: v.array(stepSchema),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const schemeId = await ctx.db.insert('schemes', {
      userId: identity.subject,
      name: args.name,
      description: args.description,
    })

    for (let i = 0; i < args.steps.length; i++) {
      const step = args.steps[i]!
      await ctx.db.insert('schemeSteps', {
        schemeId,
        paintId: step.paintId,
        sortOrder: i,
        technique: step.technique,
        notes: step.notes,
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const scheme = await ctx.db.get(args.id)
    if (!scheme || scheme.userId !== identity.subject) throw new Error('Not found or forbidden')

    const { id, steps, ...rest } = args

    if (rest.name !== undefined || rest.description !== undefined) {
      await ctx.db.patch(id, rest)
    }

    if (steps !== undefined) {
      const existing = await ctx.db
        .query('schemeSteps')
        .withIndex('by_scheme', q => q.eq('schemeId', id))
        .collect()
      for (const s of existing) {
        await ctx.db.delete(s._id)
      }
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]!
        await ctx.db.insert('schemeSteps', {
          schemeId: id,
          paintId: step.paintId,
          sortOrder: i,
          technique: step.technique,
          notes: step.notes,
        })
      }
    }
  },
})

export const remove = mutation({
  args: { id: v.id('schemes') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    const scheme = await ctx.db.get(args.id)
    if (!scheme || scheme.userId !== identity.subject) throw new Error('Not found or forbidden')

    const steps = await ctx.db
      .query('schemeSteps')
      .withIndex('by_scheme', q => q.eq('schemeId', args.id))
      .collect()
    for (const s of steps) {
      await ctx.db.delete(s._id)
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
