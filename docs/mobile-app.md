# Mobile app (`apps/mobile`)

The native iOS/Android companion to the web app, built with
[Expo](https://docs.expo.dev) SDK 57 + React Native 0.86. It is a real
native app — native tab bars, headers, transitions and haptics — not a
webview. It shares the web app's look through
[`@org/theme`](../packages/theme/README.md): the same soft-white palettes,
Plus Jakarta Sans type scale, radii and spacing that drive the web's
logged-in surfaces.

## What's inside

- **expo-router** file-based routes in `src/app/`: five native tabs
  (Today, Tasks, Goals, Agents, Settings) plus a pushed task-detail screen,
  gated behind sign-in with `Stack.Protected`. Tabs use `NativeTabs` — real
  `UITabBar` on iOS (liquid glass on iOS 26) and Material bottom navigation
  on Android.
- **Clerk auth** (`@clerk/clerk-expo`) against the same Clerk application
  as the web app: email-code sign-in plus Google/Apple SSO, matching the
  instance's enabled strategies. Session tokens are cached in the platform
  keychain/keystore via `expo-secure-store` — never in plain storage.
- **Live Convex data** (`convex/react` + `ConvexProviderWithClerk`) from
  the same deployment as the web — `src/data/hooks.ts` wraps the shared
  `tasks` / `goals` / `agents` / `users` functions in mobile view models.
  Completing a task on the phone updates the web in real time and vice
  versa.
- **`src/components/`** — native UI primitives (`AppText`, `Card`, `Chip`,
  `TaskRow`, ...) styled from `@org/theme`. This is the mobile counterpart
  of `@org/ui` (which is web-only — Radix + Tailwind can't render in RN).

## Environment variables & secrets

The app needs exactly two values, both **public by design** (they ship
inside the JS bundle — a mobile app cannot hide secrets):

```sh
EXPO_PUBLIC_CONVEX_URL=...             # same value as web's VITE_CONVEX_URL
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=...  # same value as web's VITE_CLERK_PUBLISHABLE_KEY
```

They live in the canonical store at
`~/.config/agent-workspace/mobile/.env.local` and are symlinked to
`apps/mobile/.env.local` by `scripts/link-worktree-env.sh` (run on session
start; run it manually on older worktrees). `src/env.ts` validates both at
startup and hard-refuses anything that isn't a `pk_` publishable key.

Rules:

- **Never** put `CLERK_SECRET_KEY`, webhook secrets, deploy keys, or any
  `sk_*`/`whsec_*` value in the mobile app or its env file. Those stay in
  the web/root env files and on the Convex dashboard.
- Only `EXPO_PUBLIC_*`-prefixed vars reach the bundle; Expo ignores
  everything else — but don't rely on that as your only guard.
- `EXPO_PUBLIC_*` values are inlined at **bundle time**: after changing
  the env file, restart with `expo start --clear`.
- Session tokens at runtime are stored in the iOS Keychain / Android
  Keystore (`expo-secure-store` via Clerk's token cache), not AsyncStorage.
- Store builds later: configure env per profile with EAS environment
  variables (`eas env`) — local `.env.local` files are dev-only.

## Running it

Everything works from the repo root:

```sh
pnpm dev:mobile       # start the Expo dev server (scan QR / press i or a)
pnpm mobile:ios       # start + open the iOS Simulator
pnpm mobile:android   # start + open the Android emulator
```

The dev server prints a QR code. From there:

- Press **`i`** to launch the app in the iOS Simulator (macOS only).
- Press **`a`** to launch it in an Android emulator.
- Or scan the QR code with the **Expo Go** app on a physical phone
  (App Store / Play Store) — device and computer must share a network.
- Press **`r`** to reload, **`m`** for the dev menu.

No native build step is needed for any of this: the app runs inside Expo
Go, which already contains every native module we use. You only need
`expo prebuild` / EAS builds once we add custom native code or ship to the
stores.

## Simulators: how Expo uses them

Expo doesn't ship simulators — it drives Apple's and Google's. Pressing
`i`/`a` (or running the scripts above) boots the device image, installs
Expo Go into it, and loads the app from your local Metro server. One-time
setup:

### iOS Simulator (macOS only)

1. Install **Xcode** from the Mac App Store (the full app, not just the
   command-line tools).
2. Open Xcode once and accept the license, then install the iOS platform
   under **Xcode → Settings → Components** (or `xcodebuild -downloadPlatform iOS`).
3. That's it — `pnpm mobile:ios` boots the default simulator. Pick other
   devices in Simulator via **File → Open Simulator**.

### Android emulator

1. Install **Android Studio** (`brew install --cask android-studio` or
   from the site).
2. In Android Studio: **More Actions → Virtual Device Manager → Create
   device** — pick a Pixel image with a recent API level (35+) and download
   the system image.
3. Start the virtual device (or let `pnpm mobile:android` find a running
   one). If the CLI can't find your SDK, add to your shell profile:

   ```sh
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
   ```

### Troubleshooting

- `pnpm --filter @org/mobile exec expo-doctor` — checks the project for
  version/config drift.
- If Metro serves a stale graph after dependency changes:
  `pnpm --filter @org/mobile exec expo start --clear`.
- Expo Go on a device can't reach Metro? Make sure both are on the same
  Wi-Fi, or run `expo start --tunnel`.

## Theming rules

- Never hardcode colors/fonts/radii in screens — pull them from
  `@org/theme` via `useTheme()` (see `src/theme/theme-context.tsx`).
- The palette's source of truth is the web theme in
  `apps/web/src/components/today/styles.ts`; `packages/theme` mirrors it in
  hex (React Native cannot parse `oklch()` / `color-mix()`). Change both
  together.
- Fonts: Plus Jakarta Sans is loaded in `src/app/_layout.tsx` via
  `@expo-google-fonts/plus-jakarta-sans`; use the `Font` map from
  `src/theme/fonts.ts`, never bare `fontWeight`.

## Roadmap

1. Task capture (the web app's quick-capture palette, as a native sheet).
2. A mobile village view rendered from the `@worldkit/*` headless packages.
3. Push notifications for agent reminders (expo-notifications + Convex).
