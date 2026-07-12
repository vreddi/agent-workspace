# Design system

The authenticated app (Today, Day, Agents, Goals, Tasks, Settings). The
landing page and the in-canvas pixel world have their own languages; this
file governs the app chrome around them.

## Direction: soft white, one focus

Warm paper-like surface, generous whitespace, a single accent used only for
actions and selection. The pixel village supplies all the color and delight;
the chrome around it stays nearly silent.

## Color (OKLCH, warm hue 85–95, chroma ≤ 0.008 on neutrals)

| Token | Light | Role |
| --- | --- | --- |
| `--t-bg` | `oklch(0.986 0.002 95)` | page — soft white, never blue-tinted |
| `--t-surface` | `oklch(0.998 0.001 95)` | cards, panels |
| `--t-ink-1` | `oklch(0.24 0.006 85)` | primary text |
| `--t-ink-2` | `oklch(0.5 0.008 85)` | secondary text |
| `--t-ink-3` | `oklch(0.65 0.007 85)` | placeholders, meta |
| `--t-divider` | `oklch(0.938 0.003 90)` | hairlines |
| `--t-chip-bg` | `oklch(0.962 0.003 90)` | quiet fills |
| `--t-accent` | `#2b6ef5` (user-tunable) | primary action, selection ONLY |
| `--t-overdue` | `#e25151` | overdue time text; used sparingly |

Dark theme mirrors the same roles. Never `#000`/`#fff`; never blue-gray
neutrals.

## Typography

Plus Jakarta Sans everywhere; DM Mono only for `kbd`. Fixed rem-ish scale,
ratio ~1.2: page greeting 32–34/750, section titles 18–19/800, body 14–15,
meta 12–13. One family, weight does the hierarchy.

## Layout

- Single centered column, `max-width: 1240px`, 24px gutters.
- Top bar: brand mark, quiet text nav (current page filled), primary button,
  avatar. Nothing else. All controls share one height rhythm.
- Sections stack vertically with clear gaps (32–48px); no side-by-side
  dashboard panels on the start page.
- Cards only when content is truly a contained object (the office canvas, a
  composer). Lists are rows with hairline dividers, not card grids.

## Neurodivergent-first rules (non-negotiable)

1. One primary action per screen; it is the only saturated element.
2. No autoplaying attention-grabbers: no typewriter text, no pulsing dots,
   no wiggling emoji, no shimmer placeholders longer than a beat.
3. Predictable navigation: same links, same order, same place, every page.
4. Counts and states in plain words ("2 overdue"), colored text over badges.
5. Motion only as feedback (≤200ms, ease-out); the village canvas is the
   one place ambient motion is allowed — and it's containable in one card.
6. Empty states say what to do next in one sentence.

## Components

- Inputs: 40px, radius 10, `--t-bg` fill, divider border, accent border on
  focus. Same recipe everywhere (see `.ag-input`).
- Primary button: accent fill, radius 10–11, no glow shadows.
- Quiet button/link: transparent, ink-2, hover `--t-hover`.
- Menus/popovers: shadcn components from `@org/ui` (neutral tokens).
- Keyboard hints (`kbd`) accompany primary actions, muted.

## The office canvas

The start page hero: a `VillageCanvas` scene inside a surface card, one
house per agent, residents wandering. Zoom is integer-only (pixel-perfect
1:1 or 2:1). Clicking an agent opens its GBA dialogue (personality lines).
The card never scrolls the page horizontally; zoom steps down instead.
