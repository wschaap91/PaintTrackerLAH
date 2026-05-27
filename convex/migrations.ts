import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

// Run this once via the Convex dashboard to assign existing data to a seed user.
// Usage: call internal.migrations.backfillUserId with { seedUserId: "your-user-subject-id" }
export const backfillUserId = internalMutation({
  args: { seedUserId: v.string() },
  handler: async (ctx, args) => {
    const { seedUserId } = args

    // Backfill paints
    const paints = await ctx.db.query('paints').collect()
    for (const paint of paints) {
      if (!(paint as any).userId) {
        await ctx.db.patch(paint._id, { userId: seedUserId })
      }
    }

    // Backfill schemes
    const schemes = await ctx.db.query('schemes').collect()
    for (const scheme of schemes) {
      if (!(scheme as any).userId) {
        await ctx.db.patch(scheme._id, { userId: seedUserId })
      }
    }

    // Backfill projects
    const projects = await ctx.db.query('projects').collect()
    for (const project of projects) {
      if (!(project as any).userId) {
        await ctx.db.patch(project._id, { userId: seedUserId })
      }
    }

    return { paints: paints.length, schemes: schemes.length, projects: projects.length }
  },
})
