# @org/theme

Design tokens for Agent Workspace's look: the color palettes (light + dark),
corner radii, spacing steps, and the Plus Jakarta Sans type scale, as plain
hex/number values.

**This is the single, shared token source for both apps.** Mobile reads the
palettes directly; the web app builds its `--t-*` CSS custom properties from
them in `apps/web/src/components/today/styles.ts` (which interpolates these
values), and maps `githubDark` onto its `--gh-*` / shadcn dark tokens via
`apps/web/src/lib/theme-css.ts`. Change a color here and it updates web and
mobile together — no more manual mirroring.

Values are plain hex (any `oklch()` / `color-mix()` is pre-resolved) because
React Native cannot parse those functions. The one web-only exception: the
accent _fills_ (`--t-accent-soft` / `--t-accent-ink`) are computed live with
`color-mix()` from the user's chosen accent, so those two are derived in the
web CSS rather than read from here.

Source-only package (`exports` points at `src/`) — no build step. It has no
dependencies and no platform APIs, so it is safe to import from web (Vite),
mobile (Metro), and Node.

## Public API

```ts
import {
  palettes,
  light,
  dark, // Palette per color scheme
  type Palette,
  type SchemeName,
  priority,
  brandGradient, // task priority hues, brand green gradient
  radius,
  space, // corner radii + 4px spacing scale
  fontFamily,
  monoFontFamily, // 'Plus Jakarta Sans' / 'DM Mono'
  fontSize,
  letterSpacingEm,
  tracking,
} from '@org/theme'
```

`Palette` keys map to the web CSS variables in
`apps/web/src/components/today/styles.ts` (`bg` → `--t-bg`, `ink1` →
`--t-ink-1`, ...), which interpolates them at module load. `dark` is derived
from `githubDark` (GitHub's "dark default" scale); `light` is the warm "soft
white". **This file is the source — edit here and both platforms follow.**
