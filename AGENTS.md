# Agent Workspace

An AI-native personal TODO app whose secret sauce is accountability —
nudges, reminders, and progress tracking that keep you moving. Built
neurodivergent-first (ADHD, autism, anxiety-prone users), which makes it
calmer for everyone. See `PRODUCT.md` for the mission and `DESIGN.md` for
the "soft white, one focus" design system.

The task side is real and shipped: capture and schedule **tasks** (with
priority, difficulty, deadlines, and sharing/assignment across accounts),
group them under **goals** on a kanban board with cost tracking and
deadline reminders, and chart **metrics** (numerical readings, trend
lines) against those goals. There is a **settings** page, and a full
**mobile** app runs on the same backend.

The playful twist: your AI agents are characters in a Pokémon-GBA-style
pixel village — each has a house and wanders the map. The village canvas is
one surface of the product (the emotional hook), not the whole thing; the
agents will grow into filing, reminding, and collaborating on your real
tasks.

## Repo map

| Path | What it is |
| --- | --- |
| `apps/web` | TanStack Start app (React 19, Clerk auth, Convex data, Tailwind v4) deployed to Cloudflare Workers. Routes are file-based under `src/routes/`. |
| `apps/mobile` | Expo (SDK 57) React Native app for iOS/Android, themed from `@org/theme` to match the web app. See `docs/mobile-app.md`. |
| `apps/storybook` | Storybook 10; auto-globs stories from `packages/*/src/**/*.stories.tsx`. |
| `packages/*` | `@worldkit/*` libraries. Headless: `grid`, `world`, `agents`, `pathfinding`, `tilemap`. React: `sprite-actor`, `world-canvas`. Web-only shadcn/Radix UI kit: `@org/ui`. Design tokens: `@org/theme` — the hex mirror of web's tokens that mobile styles from (see the theme note below). |
| `convex/` | Convex backend functions and schema. The app's data model — tasks, goals, metrics, reminders, agents. |
| `examples/pixi-playground` | Standalone PixiJS demo of the headless packages. |
| `docs/` | Architecture and design notes. Start with `interactive-world-canvas.md`; name new files lowercase-kebab-case. |

## Architecture invariants

- **Headless core → adapter → React.** Simulation/data packages contain no
  rendering and no React; React packages compose them. Keep it that way.
- **Plain serializable objects** for world/agent state — no class trees.
  State should be easy to save, diff, and inspect.
- **Grid inside, cozy outside.** Logic snaps to 32px grid cells; visuals
  animate smoothly between them.
- **Pixel density is 1:1.** Tile art is authored at native 32×32 (tree
  32×64, house 96×96) to match the 32×32 character sprites. Author art with
  the `CharGrid` builder in `@worldkit/tilemap`, not hand-typed strings.

## Backend / data model

The backend is Convex (`convex/`): one file of queries/mutations per table,
each with a `*.test.ts` beside it. Schema lives in `convex/schema.ts`.

| Table(s) | File | What it holds |
| --- | --- | --- |
| `users` | `users.ts` | Accounts, synced from Clerk. |
| `todos` | `todos.ts` | The original simple todo list. |
| `tasks`, `taskEvents` | `tasks.ts` | Tasks + their audit trail. |
| `taskAssignments` | `taskAssignments.ts` | Many-to-many task sharing/assignment. See `docs/task-assignments.md`. |
| `goals`, `goalTypes` | `goals.ts`, `goalTypes.ts` | Goals (kanban stages, cost, deadlines) and their categories. See `docs/goals.md`. |
| `metrics`, `metricPoints` | `metrics.ts` | Per-goal numerical metrics and their append-only readings. See `docs/metrics.md`. |
| `goalReminders` | `goalReminders.ts` | Approaching/overdue deadline nudges (driven by `crons.ts`). |
| `agents` | `agents.ts` | The village residents (name, personality, sprite). |

Cross-cutting: `crons.ts` (scheduled reminder sweeps), `migrations.ts`
(backfills, e.g. `backfillTaskAssignments`), `clerk.ts` / `auth.config.ts`
(auth). Read `convex/_generated/ai/guidelines.md` before writing Convex
code.

## Package conventions

Four sanctioned archetypes — copy the closest existing package rather than
inventing a fifth:

- **Headless** (`@worldkit/grid`, `world`, `agents`, `pathfinding`,
  `tilemap`): built with `tsdown`, tested with `vitest`, `module: nodenext`
  (relative imports need `.js` suffixes), and an exports map whose
  `@org/source` condition points at `src/` so consumers can skip builds.
- **React** (`@worldkit/sprite-actor`, `world-canvas`): private,
  source-only (exports point straight at `src/`), bundler resolution
  (extensionless imports), React as a peer dependency.
- **Tokens** (`@org/theme`): platform-neutral design tokens (colors, radii,
  type scale, spacing). Source-only, no build, zero runtime deps and no
  platform APIs so it imports cleanly from Vite, Metro, and Node. It only
  exports plain values — no components. See the theme note below.
- **UI** (`@org/ui`): the web-only shadcn/Radix component kit. Private, but
  unlike the others it has real runtime dependencies (radix-ui, recharts,
  lucide, cva, ...) and ships subpath exports (`./components/*`, `./lib/*`,
  `./hooks/*`, `./globals.css`) plus `#`-prefixed internal imports. Web
  (Tailwind v4) only — Radix can't render in React Native.

Gotchas that will bite you:

- Vite 6+ `resolve.conditions` **replaces** the defaults. When adding
  `@org/source`, spread `defaultClientConditions` / `defaultServerConditions`
  back in (see `apps/web/vite.config.ts`).
- Composite typecheck emits declarations to `out-tsc/` (gitignored). Never
  point tsconfig `outDir` at `dist/` — `tsdown --clean` wipes it and
  downstream typechecks break with TS6305.

## Theme: web is the source, mobile mirrors it

Despite the name, `@org/theme` is **not** a shared token package the web app
imports — the web app never imports it. The real design source is
`apps/web/src/components/today/styles.ts` (CSS custom properties in `oklch()`
/ `color-mix()`). `@org/theme` is a **mobile-only** hex copy of those values,
hand-mirrored because React Native can't parse `oklch()`. The two are kept in
step **manually**: change one, change the other (the theme README says the
same). Unifying them into one real cross-platform source is future work.

## Working here

- Everything is TypeScript, strict mode. No JavaScript source files.
- Write vitest tests for logic-heavy code (grid math, parsing, pathfinding,
  simulation); visual components are covered by Storybook stories instead.
- Conventional commits (`feat(scope): ...`); PRs target `develop`.
- Common commands:
  - `pnpm nx run-many -t test,build,typecheck` — full verification
  - `pnpm dev:web` — Convex + web app dev server
  - `pnpm storybook` — component workbench
- Each package has a README with its public API — read it before adding to
  that package.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
