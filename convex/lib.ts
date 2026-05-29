import type { QueryCtx, MutationCtx, ActionCtx } from './_generated/server'

type AnyCtx = QueryCtx | MutationCtx | ActionCtx

// @convex-dev/auth encodes the JWT sub claim as "userId|sessionId".
// Extract the raw userId so it matches the value stored in user-owned rows.
export async function getAuthUserId(ctx: AnyCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  return identity.subject.split('|')[0]
}
