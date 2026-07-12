# @org/ui

Shared web UI for Agent Workspace: [shadcn/ui](https://ui.shadcn.com)
components built on [Radix](https://www.radix-ui.com) primitives and styled
with Tailwind v4. **Web-only** — it pulls in `react-dom`, so mobile themes
from `@org/theme` instead.

Source-only and private: consumers resolve straight to `src/` via the
package's export map (no build step). React is a peer dependency.

## Exports

Subpath exports (see `package.json`), imported by their full specifier:

| Specifier | Resolves to | What |
| --- | --- | --- |
| `@org/ui/globals.css` | `src/styles/globals.css` | Tailwind layer + design tokens. Import once at the app root. |
| `@org/ui/components/*` | `src/components/*.tsx` | One component module per file, e.g. `@org/ui/components/button`. |
| `@org/ui/lib/*` | `src/lib/*.ts` | Helpers, e.g. `@org/ui/lib/utils` (the `cn` class-merger). |
| `@org/ui/hooks/*` | `src/hooks/*.ts` | React hooks (none shipped yet). |

Internally the same three folders are also wired as package `imports`
(`#components/*`, `#lib/*`, `#hooks/*`) so the shadcn CLI and intra-package
references stay path-stable.

## Components

`avatar`, `breadcrumb`, `button`, `calendar`, `card`, `chart`, `drawer`,
`dropdown-menu`, `input`, `label`, `popover`, `radio-group`, `select`,
`separator`, `slider`, `switch`, `tabs`.

```tsx
import { Button } from '@org/ui/components/button'
import { cn } from '@org/ui/lib/utils'

export function Save() {
  return <Button className={cn('w-full')}>Save</Button>
}
```

## Adding a component

Configured via `components.json` (style `radix-nova`, `neutral` base color,
`lucide` icons, aliases pointing at the `#`-prefixed subpaths). Use the
shadcn CLI from this package:

```sh
pnpm dlx shadcn@latest add <component>
```

New files land in `src/components/`. Prefer this over hand-writing
components so tokens, variants, and import aliases stay consistent.

## Stories

Components are documented and visually tested as Storybook stories
(`src/components/*.stories.tsx`) rather than vitest. The Storybook app
(`apps/storybook`) auto-globs them from `packages/*/src/**/*.stories.tsx`,
so a story added here shows up in the workbench with no extra wiring:

```sh
pnpm storybook
```
