# @org/theme

Platform-neutral design tokens for Agent Workspace: the "soft white" color
palettes (light + dark), corner radii, spacing steps, and the Plus Jakarta
Sans type scale. Both the web app and the Expo mobile app style themselves
from these values so the two share one look.

Source-only package (`exports` points at `src/`) — no build step. It has no
dependencies and no platform APIs, so it is safe to import from web (Vite),
mobile (Metro), and Node.

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
