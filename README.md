# Agent Workspace

An AI-native personal TODO app whose secret sauce is **accountability** —
nudges, reminders, and progress tracking that keep you moving. Built
neurodivergent-first (ADHD, autism, anxiety-prone users), which makes it
calmer for everyone. Your AI agents live as characters in a cozy
Pokémon-GBA-style pixel village — the app's emotional hook.

Shipped today: capture and schedule **tasks** (priorities, deadlines,
cross-account sharing), organize them under **goals** on a kanban board with
cost tracking and deadline reminders, chart **metrics** against those goals,
a **settings** page, and a native **mobile** app — all on one Convex backend.

## Monorepo layout

Nx + pnpm workspace. TypeScript everywhere, strict mode.

| Path             | What it is                                                                         |
| ---------------- | ---------------------------------------------------------------------------------- |
| `apps/web`       | TanStack Start app (React 19, Clerk, Convex, Tailwind v4) on Cloudflare Workers.   |
| `apps/mobile`    | Expo (SDK 57) React Native app for iOS/Android.                                    |
| `apps/storybook` | Storybook 10 component workbench.                                                  |
| `packages/*`     | `@worldkit/*` village libraries, `@org/ui` (shadcn), `@org/theme` (mobile tokens). |
| `convex/`        | Convex backend: tasks, goals, metrics, reminders, agents.                          |
| `docs/`          | Architecture and design notes — start at [docs/README.md](./docs/README.md).       |

## Quickstart

```bash
pnpm install                              # install workspace deps
pnpm dev:web                              # Convex + web dev server → http://localhost:3000
pnpm dev:mobile                           # Expo dev server (or mobile:ios / mobile:android)
pnpm storybook                            # component workbench
pnpm nx run-many -t test,build,typecheck  # full verification
```

The web app needs Clerk + Convex env vars — see
[apps/web/README.md](./apps/web/README.md).

## Where to go next

- **[AGENTS.md](./AGENTS.md)** — project mission, architecture invariants,
  package conventions, and the backend data model. Start here to work in the
  repo (human or AI agent).
- **[docs/README.md](./docs/README.md)** — the full documentation index.
