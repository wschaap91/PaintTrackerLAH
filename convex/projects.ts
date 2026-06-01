import { query, mutation } from './_generated/server'
import { v } from 'convex/values'
import { getAuthUserId } from './lib'
import type { Id } from './_generated/dataModel'

export const list = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const projects = await ctx.db
      .query('projects')
      .withIndex('by_user', q => q.eq('userId', userId))
      .collect()

    const result = await Promise.all(
      projects.map(async (project) => {
        const schemeLinks = await ctx.db
          .query('projectSchemes')
          .withIndex('by_project', q => q.eq('projectId', project._id))
          .collect()

        const paintLinks = await ctx.db
          .query('projectPaints')
          .withIndex('by_project', q => q.eq('projectId', project._id))
          .collect()

        const swatches: string[] = []
        for (const link of schemeLinks) {
          const steps = await ctx.db
            .query('schemeSteps')
            .withIndex('by_scheme', q => q.eq('schemeId', link.schemeId))
            .collect()
          for (const step of steps) {
            if (step.paintId) {
              const paint = await ctx.db.get(step.paintId)
              if (paint) swatches.push(paint.hexColor)
            }
          }
        }
        for (const link of paintLinks) {
          const paint = await ctx.db.get(link.paintId)
          if (paint) swatches.push(paint.hexColor)
        }

        return {
          ...project,
          schemeCount: schemeLinks.length,
          paintCount: paintLinks.length,
          swatches: Array.from(new Set(swatches)),
        }
      }),
    )

    return result.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export const get = query({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const project = await ctx.db.get(args.id)
    if (!project || project.userId !== userId) return null

    const schemeLinks = await ctx.db
      .query('projectSchemes')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    const stepPaintIds = new Set<Id<'paints'>>()

    const schemes = await Promise.all(
      schemeLinks.map(async (link) => {
        const scheme = await ctx.db.get(link.schemeId)
        if (!scheme) return null

        const steps = await ctx.db
          .query('schemeSteps')
          .withIndex('by_scheme', q => q.eq('schemeId', scheme._id))
          .collect()
        const sortedSteps = steps.sort((a, b) => a.sortOrder - b.sortOrder)
        const swatches: string[] = []
        for (const step of sortedSteps) {
          if (step.paintId) {
            stepPaintIds.add(step.paintId)
            const paint = await ctx.db.get(step.paintId)
            if (paint) swatches.push(paint.hexColor)
          }
        }
        return { ...scheme, swatches }
      }),
    )

    const paintLinks = await ctx.db
      .query('projectPaints')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()

    const paints = await Promise.all(
      paintLinks.map(link => ctx.db.get(link.paintId)),
    )

    // Gap analysis: find paints used in scheme steps that the user does not own
    const ownedPaints = await ctx.db
      .query('paints')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.or(
        q.eq(q.field('status'), 'owned'),
        q.eq(q.field('status'), 'running_low'),
      ))
      .collect()
    const ownedPaintIds = new Set(ownedPaints.map(p => p._id))

    const missingPaintDocs = await Promise.all(
      Array.from(stepPaintIds)
        .filter(id => !ownedPaintIds.has(id))
        .map(id => ctx.db.get(id)),
    )

    const missingPaints = missingPaintDocs
      .filter((p): p is NonNullable<typeof p> => p !== null && p.userId === userId)
      .map(p => ({
        _id: p._id,
        name: p.name,
        brand: p.brand,
        hexColor: p.hexColor,
        brandCode: p.brandCode,
        paintType: p.paintType,
      }))

    return {
      ...project,
      schemes: schemes.filter(Boolean),
      paints: paints.filter(Boolean),
      missingPaints,
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    description: v.union(v.string(), v.null()),
    schemeIds: v.array(v.id('schemes')),
    paintIds: v.array(v.id('paints')),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const projectId = await ctx.db.insert('projects', {
      userId,
      name: args.name,
      description: args.description,
    })

    for (const schemeId of args.schemeIds) {
      await ctx.db.insert('projectSchemes', { projectId, schemeId })
    }

    for (const paintId of args.paintIds) {
      await ctx.db.insert('projectPaints', { projectId, paintId })
    }

    return projectId
  },
})

export const update = mutation({
  args: {
    id: v.id('projects'),
    name: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    schemeIds: v.optional(v.array(v.id('schemes'))),
    paintIds: v.optional(v.array(v.id('paints'))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const project = await ctx.db.get(args.id)
    if (!project || project.userId !== userId) throw new Error('Not found or forbidden')

    const { id, schemeIds, paintIds, ...rest } = args

    if (rest.name !== undefined || rest.description !== undefined) {
      await ctx.db.patch(id, rest)
    }

    if (schemeIds !== undefined) {
      const existing = await ctx.db
        .query('projectSchemes')
        .withIndex('by_project', q => q.eq('projectId', id))
        .collect()
      for (const link of existing) await ctx.db.delete(link._id)
      for (const schemeId of schemeIds) {
        await ctx.db.insert('projectSchemes', { projectId: id, schemeId })
      }
    }

    if (paintIds !== undefined) {
      const existing = await ctx.db
        .query('projectPaints')
        .withIndex('by_project', q => q.eq('projectId', id))
        .collect()
      for (const link of existing) await ctx.db.delete(link._id)
      for (const paintId of paintIds) {
        await ctx.db.insert('projectPaints', { projectId: id, paintId })
      }
    }
  },
})

export const remove = mutation({
  args: { id: v.id('projects') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Unauthenticated')

    const project = await ctx.db.get(args.id)
    if (!project || project.userId !== userId) throw new Error('Not found or forbidden')

    const schemeLinks = await ctx.db
      .query('projectSchemes')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()
    for (const link of schemeLinks) await ctx.db.delete(link._id)

    const paintLinks = await ctx.db
      .query('projectPaints')
      .withIndex('by_project', q => q.eq('projectId', args.id))
      .collect()
    for (const link of paintLinks) await ctx.db.delete(link._id)

    await ctx.db.delete(args.id)
  },
})
