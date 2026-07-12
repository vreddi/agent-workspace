# Agent Workspace

An AI-assisted task management app with a playful twist: your AI agents are
characters in a Pokémon-GBA-style pixel village. Each agent has its own
house, wanders the map autonomously, and will eventually file, remind, and
collaborate on your real tasks. The village canvas is live; the task
features are being built on top of it.

## Repo map

| Path | What it is |
| --- | --- |
| `apps/web` | TanStack Start app (React 19, Clerk auth, Convex data, Tailwind v4) deployed to Cloudflare Workers. Routes are file-based under `src/routes/`. |
| `apps/mobile` | Expo (SDK 57) React Native app for iOS/Android with full task/goal parity to the web, themed from `@org/theme` and sharing view-model logic via `@org/app-core`. See `docs/mobile-app.md` and `docs/mobile-web-parity.md`. |
| `apps/storybook` | Storybook 10; auto-globs stories from `packages/*/src/**/*.stories.tsx`. |
| `packages/*` | `@worldkit/*` libraries. Headless: `grid`, `world`, `agents`, `pathfinding`, `tilemap`. React: `sprite-actor`, `world-canvas`. Shared UI (shadcn/radix, web-only): `ui`. Cross-platform design tokens: `theme` (`@org/theme`, consumed by web + mobile). Cross-platform view-model helpers (task/goal/metric logic, deadlines, formatting — headless, no React/DOM/Convex): `app-core` (`@org/app-core`, consumed by web + mobile). |
| `convex/` | Convex backend functions and schema. |
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

## Package conventions

Two flavors — copy an existing package rather than inventing a third:

- **Headless** (`grid`, `world`, `tilemap`, ...): built with `tsdown`,
  tested with `vitest`, `module: nodenext` (relative imports need `.js`
  suffixes), and an exports map whose `@org/source` condition points at
  `src/` so consumers can skip builds.
- **React** (`sprite-actor`, `world-canvas`): private, source-only (exports
  point straight at `src/`), bundler resolution (extensionless imports),
  React as a peer dependency.

Gotchas that will bite you:

- Vite 6+ `resolve.conditions` **replaces** the defaults. When adding
  `@org/source`, spread `defaultClientConditions` / `defaultServerConditions`
  back in (see `apps/web/vite.config.ts`).
- Composite typecheck emits declarations to `out-tsc/` (gitignored). Never
  point tsconfig `outDir` at `dist/` — `tsdown --clean` wipes it and
  downstream typechecks break with TS6305.

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
