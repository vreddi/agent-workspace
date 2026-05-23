import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { Webhook } from 'svix'
import { internal } from './_generated/api'
import type { WebhookEvent } from '@clerk/backend'

const http = httpRouter()

http.route({
  path: '/clerk',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.CLERK_WEBHOOK_SECRET!

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
  }),
})

export default http
