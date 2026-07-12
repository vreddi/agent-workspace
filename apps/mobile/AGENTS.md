# apps/mobile

Expo (SDK 57) + React Native 0.86 iOS/Android app on the same Convex backend
and Clerk instance as the web app. Root conventions live in the repo-root
`AGENTS.md`; full detail is in `docs/mobile-app.md`. This file is gotchas
only.

- **A real native app**, not a webview — native tabs/headers/haptics via
  expo-router (`src/app/`). Keep screens native; no webviews.
- **Theming:** never hardcode colors/fonts/radii. Pull from `@org/theme`
  via `useTheme()`. `@org/theme` is the **mobile-only hex mirror** of web's
  `apps/web/src/components/today/styles.ts` (RN can't parse `oklch()`); if
  you change one, change the other. See the root `AGENTS.md` theme note.
- **Run it** (from repo root): `pnpm dev:mobile` (Expo dev server), or
  `pnpm mobile:ios` / `pnpm mobile:android` to boot a simulator/emulator.
- **Env:** two `EXPO_PUBLIC_*` values only (Convex URL + Clerk publishable
  key), inlined at bundle time — restart with `expo start --clear` after
  changing them. Never put `sk_*` / `whsec_*` secrets in this app.
- **TypeScript here is `~6.0.3`** (React Native's toolchain), newer than the
  rest of the workspace's `~5.9.2` — don't "fix" the mismatch by downgrading.
- Typecheck: `pnpm --filter @org/mobile typecheck`.
