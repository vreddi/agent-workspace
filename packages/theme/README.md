# @org/theme

Design tokens for Agent Workspace's "soft white" look: the color palettes
(light + dark), corner radii, spacing steps, and the Plus Jakarta Sans type
scale, as plain hex/number values.

**This is the mobile app's token source, not a shared one.** The web app does
**not** import `@org/theme` — its design source is
`apps/web/src/components/today/styles.ts` (CSS custom properties in `oklch()`
/ `color-mix()`). This package is a hand-maintained **hex mirror** of that
file, because React Native cannot parse `oklch()` / `color-mix()`. The web
file leads; this package follows, and the two are synced **manually**
(see below). Unifying them into one real cross-platform source is future
work.

Source-only package (`exports` points at `src/`) — no build step. It has no
dependencies and no platform APIs, so it is safe to import from web (Vite),
mobile (Metro), and Node — though today only mobile does.

## Public API

```ts
import {
  palettes, light, dark,      // Palette per color scheme
  type Palette, type SchemeName,
  priority, brandGradient,    // task priority hues, brand green gradient
  radius, space,              // corner radii + 4px spacing scale
  fontFamily, monoFontFamily, // 'Plus Jakarta Sans' / 'DM Mono'
  fontSize, letterSpacingEm, tracking,
} from '@org/theme'
```

`Palette` keys mirror the web CSS variables in
`apps/web/src/components/today/styles.ts` (`--t-bg` → `bg`, `--t-ink-1` →
`ink1`, ...). The web file is the design source; oklch / `color-mix()`
values are pre-resolved to hex here because React Native cannot parse
them. **If you change one, change the other.**
