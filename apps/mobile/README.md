# @org/mobile

Native iOS/Android app for Agent Workspace — Expo SDK 57, React Native,
expo-router, themed from [`@org/theme`](../../packages/theme/README.md) so
it matches the web app.

```sh
pnpm dev:mobile       # from the repo root: Expo dev server
pnpm mobile:ios       # open in the iOS Simulator
pnpm mobile:android   # open in an Android emulator
```

Full run/simulator/troubleshooting guide: [docs/mobile-app.md](../../docs/mobile-app.md).

## Layout

| Path | What it is |
| --- | --- |
| `src/app/` | expo-router routes: `sign-in`, `(tabs)/` native tabs (Today, Tasks, Goals, Agents, Settings), `task/[id]` detail. Signed-in routes are gated with `Stack.Protected`. |
| `src/components/` | Native UI primitives styled from `@org/theme` (mobile counterpart of the web-only `@org/ui`). |
| `src/theme/` | Theme context (light/dark/system) + Plus Jakarta Sans font map. |
| `src/data/hooks.ts` | Live Convex hooks over the shared `tasks`/`goals`/`agents`/`users` functions, mapped to mobile view models. |
| `src/env.ts` | Validated public config (`EXPO_PUBLIC_*` only — see docs for the secrets policy). |
| `src/lib/` | Small date/format helpers. |

Auth is the same Clerk application as the web app (email code +
Google/Apple SSO); data is the same Convex deployment, live-synced.

Rules: no hardcoded colors or fonts in screens — everything comes from
`@org/theme` through `useTheme()`; keep screens native (no webviews); no
secrets in this app, ever — only `EXPO_PUBLIC_*` publishable values.
