import { httpRouter } from 'convex/server'
import { handleClerkWebhook } from './clerk'

// Canonical HTTP entry point. Convex only mounts endpoints from the default
// export of `convex/http.ts`, so every route the deployment serves must be
// registered here. Route handlers themselves live in their own modules
// (e.g. the Clerk webhook in `convex/clerk.ts`).
const http = httpRouter()

http.route({
  path: '/clerk',
  method: 'POST',
  handler: handleClerkWebhook,
})

export default http
