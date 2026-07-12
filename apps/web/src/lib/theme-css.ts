import { githubDark } from '@org/theme'

/**
 * Bridges the cross-platform `@org/theme` tokens into web CSS custom
 * properties. `@org/theme` is the single source of truth (mobile reads the
 * same values); this file only names them for CSS so the palette can never
 * drift between platforms.
 *
 * The `--gh-*` variables are the GitHub-dark scale. They're consumed by the
 * shadcn dark tokens in `@org/ui` globals.css and the day-view `--d-*` tokens,
 * and are injected once at the document root (see `__root.tsx`). The `--t-*`
 * app-surface variables are built from the `light`/`dark` palettes directly in
 * `components/today/styles.ts`.
 */
export const githubDarkVarsCss = Object.entries(githubDark)
  .map(([key, value]) => {
    // canvasInset → --gh-canvas-inset, fgMuted → --gh-fg-muted, …
    const name = key.replace(/[A-Z0-9]+/g, (m) => `-${m.toLowerCase()}`)
    return `  --gh-${name}: ${value};`
  })
  .join('\n')

/** Global dark-mode token block, injected at the document root. */
export const darkTokensCss = `:root.dark {\n${githubDarkVarsCss}\n}`
