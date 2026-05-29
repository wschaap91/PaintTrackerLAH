import { internalMutation, internalAction } from './_generated/server'
import { internal } from './_generated/api'
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

// ---------------------------------------------------------------------------
// normalizeArmyPainterNames — internalAction
// Drives paginated cleanup of Army Painter catalogPaints rows:
//   - strips range prefixes from `name`
//   - backfills correct `range`
//   - corrects `paintType`
// Idempotent: rows already normalised are skipped.
// Run once via the Convex dashboard after deploying.
// ---------------------------------------------------------------------------

// Prefix rules ordered longest-first to prevent shorter rules matching first.
// Each entry: [prefixOrExactName, range, paintType, isExactMatch]
const ARMY_PAINTER_PREFIX_RULES: Array<[string, string, string, boolean]> = [
  ['Warpaints Fanatic Most Wanted Set', 'Warpaints Fanatic', 'set', true],
  ['Warpaints Fanatic Metallic: ', 'Warpaints Fanatic Metallic', 'metallic', false],
  ['Warpaints Fanatic Effects: ', 'Warpaints Fanatic Effects', 'effects', false],
  ['Warpaints Fanatic Wash: ', 'Warpaints Fanatic Wash', 'wash', false],
  ['Warpaints Fanatic: ', 'Warpaints Fanatic', 'acrylic', false],
  ['John Blanche Masterclass: ', 'John Blanche Masterclass', 'acrylic', false],
  ['Flexible Triad: ', 'Flexible Triad', 'set', false],
  ['Historical: ', 'Historical', 'acrylic', false],
]

type NormalizeResult = {
  newName: string
  newRange: string
  newPaintType: string
} | null

function classifyArmyPainterRow(
  name: string,
  brandCode: string,
): NormalizeResult {
  const isSpeedpaint2 = brandCode.startsWith('WP2')

  for (const [prefixOrExact, range, paintType, isExact] of ARMY_PAINTER_PREFIX_RULES) {
    if (isExact) {
      if (name === prefixOrExact) {
        return {
          newName: name,
          newRange: isSpeedpaint2 ? 'Speedpaint 2.0' : range,
          newPaintType: isSpeedpaint2 ? 'speedpaint' : paintType,
        }
      }
    } else {
      if (name.startsWith(prefixOrExact)) {
        const strippedName = name.slice(prefixOrExact.length).trim()
        if (!strippedName) return null
        return {
          newName: strippedName,
          newRange: isSpeedpaint2 ? 'Speedpaint 2.0' : range,
          newPaintType: isSpeedpaint2 ? 'speedpaint' : paintType,
        }
      }
    }
  }

  if (isSpeedpaint2) {
    return { newName: name, newRange: 'Speedpaint 2.0', newPaintType: 'speedpaint' }
  }

  return null
}

export const normalizeArmyPainterNames = internalAction({
  args: {},
  handler: async (ctx): Promise<{ patched: number; skipped: number }> => {
    let cursor: string | null = null
    let totalPatched = 0
    let totalSkipped = 0

    do {
      const result: { patched: number; skipped: number; cursor: string | null; isDone: boolean } =
        await ctx.runMutation(internal.migrations.normalizeArmyPainterNamesBatch, { cursor })
      totalPatched += result.patched
      totalSkipped += result.skipped
      cursor = result.isDone ? null : result.cursor
    } while (cursor !== null)

    return { patched: totalPatched, skipped: totalSkipped }
  },
})

export const normalizeArmyPainterNamesBatch = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ patched: number; skipped: number; cursor: string | null; isDone: boolean }> => {
    const BATCH_SIZE = 100

    const page = await ctx.db
      .query('catalogPaints')
      .withIndex('by_brand', q => q.eq('brand', 'The Army Painter'))
      .paginate({ cursor: args.cursor, numItems: BATCH_SIZE })

    let patched = 0
    let skipped = 0

    for (const row of page.page) {
      const result = classifyArmyPainterRow(row.name, row.brandCode)

      if (result === null) {
        // No rule matched — nothing to do for this row
        skipped++
        continue
      }

      const { newName, newRange, newPaintType } = result

      // Idempotency check: skip if already normalised
      if (row.name === newName && row.range === newRange && row.paintType === newPaintType) {
        skipped++
        continue
      }

      await ctx.db.patch(row._id, {
        name: newName,
        range: newRange,
        paintType: newPaintType,
      })
      patched++
    }

    return {
      patched,
      skipped,
      cursor: page.isDone ? null : page.continueCursor,
      isDone: page.isDone,
    }
  },
})
