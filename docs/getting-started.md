# Getting started

Development setup for this workspace. Conventions and gotchas live in
[AGENTS.md](../AGENTS.md) — read that first; this file is the practical
command reference.

## Prerequisites

- **Node.js** 22+ (CI uses 24)
- **pnpm** 10 (`corepack enable` picks up the version pinned in
  `package.json`'s `packageManager`)
- **Git**

## Setup

```bash
pnpm install
```

Then verify everything passes:

```bash
pnpm nx run-many -t test,build,typecheck
```

## Common commands

| Command                                    | What it does                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `pnpm dev:web`                             | Convex dev + web app dev server (needs `apps/web/.env.local` — see [apps/web/README.md](../apps/web/README.md)) |
| `pnpm storybook`                           | Component workbench for all packages                                                                            |
| `pnpm nx run-many -t test,build,typecheck` | Full verification                                                                                               |
| `pnpm nx test @worldkit/grid`              | Test one package (add `--watch` for watch mode)                                                                 |
| `pnpm nx affected -t test,build,typecheck` | Only what your changes touch                                                                                    |
| `pnpm nx graph`                            | Interactive dependency diagram                                                                                  |
| `pnpm deploy:web`                          | Deploy the web app — see [deployment.md](./deployment.md)                                                       |

Always run tasks through `nx` (prefixed with `pnpm`) rather than the
underlying tooling directly — Nx handles caching and dependency order.

## Workflow

1. Branch from `develop` (PRs target `develop`).
2. Make changes; write vitest tests for logic-heavy code (grid math,
   parsing, pathfinding, simulation). Visual components get Storybook
   stories instead.
3. Verify: `pnpm nx affected -t test,build,typecheck`.
4. Commit with conventional commits (`feat(scope): ...`) and open a PR.

## Project structure

```
.
├── apps/
│   ├── web/               # TanStack Start app (Clerk + Convex), Cloudflare Workers
│   └── storybook/         # Storybook 10, globs stories from packages
├── packages/              # @worldkit/* libraries + @org/ui
│   ├── grid/              # Headless: coordinates, neighbors, bounds
│   ├── world/             # Headless: terrain, objects, occupancy
│   ├── agents/            # Headless: agent model
│   ├── pathfinding/       # Headless: A* over a world
│   ├── tilemap/           # Headless + Canvas2D renderer: tiles, maps
│   ├── sprite-actor/      # React: sprite-sheet characters
│   ├── world-canvas/      # React: the village canvas
│   └── ui/                # React: shared shadcn/radix components
├── convex/                # Convex backend functions and schema
├── examples/
│   └── pixi-playground/   # Standalone PixiJS demo
└── docs/                  # You are here — see README.md for the index
```

## Creating a new package

Copy an existing package of the right flavor rather than scaffolding from
scratch — there are exactly two:

- **Headless** (copy `grid` or `world`): `tsdown` build, `vitest` tests,
  `module: nodenext` (relative imports need `.js` suffixes), exports map
  with an `@org/source` condition pointing at `src/`.
- **React** (copy `sprite-actor`): private, source-only exports, bundler
  resolution, React as a peer dependency.

Each package has a README documenting its public API — read it before
adding to that package.

## Troubleshooting

**Typecheck fails with TS6305 after a build** — a tsconfig `outDir` is
pointing at `dist/`, which `tsdown --clean` wipes. Composite typecheck must
emit to `out-tsc/` (gitignored). See AGENTS.md.

**Package resolves to stale/built code in Vite** — Vite 6+
`resolve.conditions` _replaces_ the defaults. When adding `@org/source`,
spread `defaultClientConditions` / `defaultServerConditions` back in (see
`apps/web/vite.config.ts`).

**IDE shows type errors but `nx typecheck` passes** — restart the TS
server (VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server").

**Weird caching behavior** — `pnpm nx reset`, then reinstall if needed.

**Convex complains on `pnpm dev:web`** — read
`convex/_generated/ai/guidelines.md` and check `apps/web/.env.local`
against [apps/web/README.md](../apps/web/README.md).
