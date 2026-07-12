import { ConvexError } from 'convex/values'
import { QueryCtx } from '../_generated/server'
import { getCurrentUser } from '../users'

/**
 * Resolve the authenticated user's id, throwing if the request is
 * unauthenticated. Shared by every endpoint module so the auth check stays
 * in one place. Lives under `convex/lib/` (not `convex/` root) so it is a
 * plain helper module rather than a registered function module.
 */
export async function requireUserId(ctx: QueryCtx) {
  const user = await getCurrentUser(ctx)
  if (!user) {
    throw new ConvexError('Not authenticated')
  }
  return user._id
}
