# Tech stack

This document describes the technologies used in the web app (`apps/web`) and shared workspace tooling.

## Application (`apps/web`)

| Layer             | Technology                                                                                                                         | Role                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Framework         | [TanStack Start](https://tanstack.com/start)                                                                                       | Full-stack React app, SSR, file routes                |
| Routing           | [TanStack Router](https://tanstack.com/router)                                                                                     | Type-safe routes, loaders, layouts                    |
| UI                | [React 19](https://react.dev)                                                                                                      | UI runtime                                            |
| Styling           | [Tailwind CSS v4](https://tailwindcss.com) + [`@org/ui`](../packages/ui)                                                           | Design system (shadcn-style components)               |
| Auth              | [Clerk](https://clerk.com) (`@clerk/tanstack-react-start`)                                                                         | Sign-in, sign-up, sessions, user management           |
| Backend / DB      | [Convex](https://convex.dev)                                                                                                       | Real-time database, server functions, auth validation |
| Data fetching     | [TanStack Query](https://tanstack.com/query) + `@convex-dev/react-query`                                                           | SSR-friendly Convex queries                           |
| Env validation    | [@t3-oss/env-core](https://env.t3.gg) + Zod                                                                                        | Type-safe `apps/web/.env.local`                       |
| Build             | [Vite 7](https://vite.dev)                                                                                                         | Dev server and production bundle                      |
| Hosting (web)     | [Cloudflare Workers](https://developers.cloudflare.com/workers/) + [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | SSR TanStack Start deploy (`apps/web/wrangler.jsonc`) |
| Design docs       | [Storybook 10](https://storybook.js.org) (`apps/storybook`)                                                                        | Component catalog for `@org/ui`                       |
| Storybook hosting | [Chromatic](https://www.chromatic.com/)                                                                                            | Hosted Storybook + visual review on PRs               |

### Auth + Convex flow

1. User signs in via **Clerk** (modal or Account Portal).
2. The app obtains a Clerk JWT from the **`convex`** JWT template.
3. **`ConvexProviderWithClerk`** sends that token with every Convex request.
4. Convex validates the token using `convex/auth.config.ts` (`CLERK_JWT_ISSUER_DOMAIN`).
5. Convex queries/mutations (tasks, groups, todos) use `ctx.auth.getUserIdentity().subject` as `userId`.

## Monorepo

| Tool                    | Role                                         |
| ----------------------- | -------------------------------------------- |
| [pnpm](https://pnpm.io) | Package manager, workspaces                  |
| [Nx](https://nx.dev)    | Task orchestration (`nx run`, `nx affected`) |
| TypeScript              | Shared language across apps and packages     |

## Other packages (workspace)

The `@worldkit/*` libraries under `packages/` power the agent-village world canvas (headless grid/world/pathfinding logic plus React rendering); `@org/ui` holds shared shadcn/radix components. See [architecture.md](./architecture.md).

## Deployment

| Target                | Command / doc                                                            |
| --------------------- | ------------------------------------------------------------------------ |
| Web (Cloudflare)      | `pnpm deploy:web` — see [deployment.md](./deployment.md)                 |
| Storybook (Chromatic) | `nx run @org/storybook:chromatic` — see [deployment.md](./deployment.md) |

## Related docs

- [deployment.md](./deployment.md) — Cloudflare Workers + Chromatic setup
- [apps/web/README.md](../apps/web/README.md) — run locally, env setup
- [AGENTS.md](../AGENTS.md) — project conventions (agents, Nx, packages)
- [Convex + Clerk](https://docs.convex.dev/auth/clerk)
- [TanStack Start + Clerk](https://docs.convex.dev/client/tanstack/tanstack-start/clerk)
