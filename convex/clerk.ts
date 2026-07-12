import { httpAction } from './_generated/server'
import { Webhook } from 'svix'
import { internal } from './_generated/api'
import type { WebhookEvent } from '@clerk/backend'

// Clerk webhook handler. Registered on the HTTP router in `convex/http.ts`
// (the only module Convex mounts HTTP endpoints from). Clerk POSTs user
// lifecycle events here; we verify the svix signature and mirror them into
// the `users` table via internal mutations.
export const handleClerkWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    // Without the signing secret every request would fail verification (or
    // crash inside `new Webhook(undefined)`), so surface a clear, actionable
    // error instead. Set it with `npx convex env set CLERK_WEBHOOK_SECRET ...`.
    console.error(
      'CLERK_WEBHOOK_SECRET is not set; cannot verify Clerk webhook',
    )
    return new Response(
      'Server misconfigured: CLERK_WEBHOOK_SECRET is not set',
      {
        status: 500,
      },
    )
  }

  const headers: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    headers[key] = value
  })
  const body = await request.text()

  const wh = new Webhook(secret)
  let event: WebhookEvent

  try {
    event = wh.verify(body, headers) as WebhookEvent
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Unauthorized', { status: 401 })
  }

  const eventType = event.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    await ctx.runMutation(internal.users.upsertFromClerk, { data: event.data })
  }

  if (eventType === 'user.deleted') {
    const id = event.data.id
    if (id) {
      await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId: id })
    }
  }

  return new Response(null, { status: 200 })
})
