# Getting Started: Development Setup

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+ (see [pnpm docs](https://pnpm.io/installation) for install)
- **Git**

## Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

This installs all workspace dependencies and sets up the monorepo.

### 2. Verify Installation

```bash
pnpm typecheck
```

Should report no TypeScript errors.

```bash
pnpm lint
```

Should report no linting issues (or only informational notices).

## Common Commands

### Build

Build all packages:
```bash
pnpm build
```

Build a specific package:
```bash
pnpm nx build @worldkit/core
```

Build only changed packages:
```bash
pnpm nx affected:build
```

### Tests

Run all tests:
```bash
pnpm test
```

Run tests for a specific package:
```bash
pnpm nx test @worldkit/core
```

Watch mode (re-run on file changes):
```bash
pnpm nx test @worldkit/core --watch
```

### Linting & Type Checking

```bash
pnpm lint          # ESLint
pnpm typecheck     # TypeScript
pnpm format        # Auto-format with Prettier
```

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make changes** in `packages/*/src/`

3. **Test locally:**
   ```bash
   pnpm test
   pnpm typecheck
   ```

4. **Format code:**
   ```bash
   pnpm format
   ```

5. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   git push origin feat/my-feature
   ```

## Project Structure

```
.
├── packages/
│   ├── core/              # Foundational types
│   ├── grid/              # Grid logic
│   ├── world/             # World state model
│   ├── agents/            # Agent model
│   ├── actions/           # Action types
│   ├── pathfinding/       # A* pathfinding
│   ├── movement/          # Movement rules
│   ├── simulation/        # Simulation engine
│   ├── assets/            # (Optional) Asset registry
│   ├── renderer/          # (Optional) Renderer interface
│   ├── renderer-pixi/     # (Optional) PixiJS impl
│   ├── react/             # (Optional) React bindings
│   ├── editor/            # (Optional) Editor tools
│   ├── ai/                # (Optional) AI integration
│   └── bundle/            # Monolithic re-export
├── examples/
│   └── basic-simulation/  # Headless example
├── docs/
│   ├── VISION.md
│   ├── ARCHITECTURE.md
│   ├── GETTING_STARTED.md (this file)
│   └── DESIGN_DECISIONS.md
└── package.json / pnpm-workspace.yaml / etc.
```

## Working with Nx

This monorepo uses **Nx** for task orchestration. All commands can be run through `pnpm nx`.

### Graph Visualization

See how packages depend on each other:
```bash
pnpm nx graph
```

This opens an interactive diagram in your browser.

### Dependency Checks

See if there are circular dependencies:
```bash
pnpm nx affected:build --verbose
```

## Creating a New Package

Use the `nx-generate` skill or follow this template:

1. Create directory: `packages/my-package/`
2. Add `package.json`:
   ```json
   {
     "name": "@worldkit/my-package",
     "version": "0.0.1",
     "description": "Brief description",
     "main": "./dist/index.js",
     "module": "./dist/index.esm.js",
     "types": "./dist/index.d.ts",
     "exports": {
       ".": {
         "import": "./dist/index.esm.js",
         "require": "./dist/index.js",
         "types": "./dist/index.d.ts"
       }
     },
     "scripts": {
       "build": "tsup src/index.ts",
       "test": "vitest"
     }
   }
   ```

3. Add `src/index.ts`:
   ```ts
   // Public API
   export { MyType } from "./my-type";
   export { myFunction } from "./my-function";
   ```

4. Add `tsconfig.json`:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist"
     },
     "include": ["src"],
     "references": [
       { "path": "../core" }
       // Add other dependencies
     ]
   }
   ```

## Debugging

### TypeScript Errors

Check types:
```bash
pnpm typecheck
```

### Test Failures

Run a single test file:
```bash
pnpm nx test @worldkit/core --testFile=src/grid.test.ts
```

Get more verbose output:
```bash
pnpm nx test @worldkit/core --verbose
```

### Build Issues

Clean build artifacts:
```bash
pnpm nx reset
pnpm install
pnpm build
```

## IDE Setup

### VS Code

1. Install "TypeScript Vue Plugin (Volar)" extension (optional, for Vue support if needed later)
2. Install "ESLint" extension
3. Install "Prettier" extension

Configuration is in `.vscode/settings.json` and `.eslintrc.json`.

### Other IDEs

- **WebStorm/IntelliJ:** Built-in TypeScript and ESLint support. Just open the project root.
- **Vim/Neovim:** Use LSP client (e.g., `coc.nvim`, `nvim-lsp`) with TypeScript server.

## Running Examples

After implementing Milestone 1, run the basic example:

```bash
pnpm nx run examples-basic-simulation:build
node examples/basic-simulation/dist/index.js
```

Or for a development watch mode (if configured):
```bash
pnpm nx run examples-basic-simulation:dev
```

## Documentation Generation

Generate TypeDoc documentation (when implemented):

```bash
pnpm nx run @worldkit/core:docs
```

Documentation will be in `packages/core/docs/index.html`.

## Troubleshooting

### "pnpm: command not found"

Install pnpm globally:
```bash
npm install -g pnpm@latest
```

### Packages not found when importing

Clear node_modules and reinstall:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors in IDE but tests pass

Reload the TypeScript server:
- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- WebStorm: Invalidate caches and restart

### Tests fail but code looks right

Check that dependencies are correct in `tsconfig.json` `references`:
```bash
pnpm typecheck
```

## Next Steps

1. Read [VISION.md](./VISION.md) to understand the "why"
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the structure
3. Check out [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) for key choices
4. Start implementing Milestone 1 packages in order:
   - `@worldkit/core`
   - `@worldkit/grid`
   - `@worldkit/world`
   - `@worldkit/agents`
   - `@worldkit/actions`
   - `@worldkit/pathfinding`
   - `@worldkit/simulation`
   - `@worldkit/bundle`

5. Write tests as you go
6. Create a basic headless example to prove it works

## Resources

- **Nx Docs:** https://nx.dev
- **TypeScript:** https://www.typescriptlang.org
- **Vitest:** https://vitest.dev
- **pnpm Workspaces:** https://pnpm.io/workspaces
- **ESLint:** https://eslint.org
- **Prettier:** https://prettier.io

## Getting Help

- Check the docs in this folder
- Look at test files for usage examples
- Check package READMEs
- Open an issue on GitHub

---

Happy hacking! 🎮
