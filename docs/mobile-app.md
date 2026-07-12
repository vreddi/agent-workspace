# Mobile app (`apps/mobile`)

The native iOS/Android companion to the web app, built with
[Expo](https://docs.expo.dev) SDK 57 + React Native 0.86. It is a real
native app — native tab bars, headers, transitions and haptics — not a
webview. It shares the web app's look through
[`@org/theme`](../packages/theme/README.md) and its product logic through
[`@org/app-core`](../packages/app-core/README.md): the same palettes, type
scale, deadline math and task/goal view-model helpers that drive the web's
logged-in surfaces.

The app now has full **task and goal parity** with the web — you can
create, edit, and manage tasks and goals from the phone, not just read
them. For how the two clients stay in sync and where new logic belongs, see
[mobile-web-parity.md](./mobile-web-parity.md).

## What's inside

- **expo-router** file-based routes in `src/app/`: five native tabs
  (Today, Tasks, Goals, Agents, Settings) plus pushed and modal screens for
  task and goal detail/create/edit, gated behind sign-in with
  `Stack.Protected`. Tabs use `NativeTabs` — real `UITabBar` on iOS (liquid
  glass on iOS 26) and Material bottom navigation on Android.
- **Clerk auth** (`@clerk/clerk-expo`) against the same Clerk application
  as the web app: email-code sign-in plus Google/Apple SSO, matching the
  instance's enabled strategies. Session tokens are cached in the platform
  keychain/keystore via `expo-secure-store` — never in plain storage.
- **Live Convex data** (`convex/react` + `ConvexProviderWithClerk`) from
  the same deployment as the web. `src/data/hooks.ts`, `tasks-data.ts` and
  `goals-data.ts` wrap the shared Convex functions in mobile view models;
  mutations write straight through, so a change on the phone shows on the
  web in real time and vice versa.
- **`@org/app-core`** — the headless, cross-platform view-model logic
  (deadline formatting, task display/sort/filter, tone/assignee helpers,
  goal type value coding) shared with the web. Mobile imports it from
  source the same way it imports `@org/theme`.
- **`src/components/`** — native UI primitives (`AppText`, `Card`, `Chip`,
  `TaskRow`, ...) and the create/edit **form kit** in `forms.tsx`
  (`FormScreen`, `FormSection`, `TextFieldRow`, `SelectRow`, `DateFieldRow`,
  `StepperRow`, `ChipRowGroup`, `FooterButton`, `confirmDestructive`), all
  styled from `@org/theme`. This is the mobile counterpart of `@org/ui`
  (web-only — Radix + Tailwind can't render in RN).

## Screens

| Route | What it does |
| --- | --- |
| `(tabs)/index` — Today | Agenda: overdue / due-today / done-today sections and a greeting; FAB opens the capture modal. |
| `(tabs)/tasks` — Tasks | Full task list with All / Open / Overdue / Done filter chips; `+` opens capture. |
| `(tabs)/goals` — Goals | Goals by status (Active / Achieved / Archived) with progress, an unread-reminders banner, and create. |
| `(tabs)/agents` — Agents | Read-only list of your agents (the village view is roadmap). |
| `(tabs)/settings` — Settings | Account + sign out, theme preference, reminders toggle, version/about. |
| `task/new` (modal) | Quick-capture: title + emoji, priority, target date, goal link, and an "Add details" disclosure (description, hard deadline, estimate, cost). Accepts `?goalId=` to prefill. |
| `task/[id]` | Task detail: status chips, metadata, linked goal, notes, assignees (with user search), activity history, and delete (creator only). |
| `task/[id]/edit` (modal) | Full task editor over the form kit. |
| `goal/[id]` | Goal detail: progress, deadline, achieve / archive / reactivate / delete, a board of stages (In progress / To do / Done) with per-task stage moves, attach/detach, and add-task, plus a **Metrics** section (per-goal numeric metrics with sparkline, progress toward target, and inline reading capture). |
| `goal/new`, `goal/edit` (modals) | Create/edit a goal, including inline custom goal-type creation. These register their own `Stack.Screen` options in-route. |
| `goal/metric` (modal) | Create/edit a numeric metric for a goal (name, unit, direction, target, baseline). Opened from the goal-detail Metrics section; registers its own `Stack.Screen` options in-route. |

Per-goal **metrics** are at full parity with the web: the goal-detail
screen renders a Metrics section where you can create, edit, and delete a
numeric metric (name, unit, direction, target, baseline) and log, edit, or
delete individual readings. Each metric card shows the latest value, its
delta from baseline, a progress bar toward target, and a `react-native-svg`
sparkline.

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
- Device-local UI preferences (theme, the reminders toggle) are persisted
  with AsyncStorage via `src/lib/preferences.ts` — never user data (that's
  Convex) and never secrets (that's `expo-secure-store`).
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
  `@org/theme` via `useTheme()` (see `src/theme/theme-context.tsx`). The
  provider resolves `system`/`light`/`dark`, persisting the choice through
  `src/lib/preferences.ts`.
- The palette's source of truth is the web theme in
  `apps/web/src/components/today/styles.ts`; `packages/theme` mirrors it in
  hex (React Native cannot parse `oklch()` / `color-mix()`). Change both
  together.
- Fonts: Plus Jakarta Sans is loaded in `src/app/_layout.tsx` via
  `@expo-google-fonts/plus-jakarta-sans`; use the `Font` map from
  `src/theme/fonts.ts`, never bare `fontWeight`.

## Roadmap

1. A mobile **village view** rendered from the `@worldkit/*` headless
   packages (the Agents tab is a plain list today).
2. **Push notifications** for agent reminders (expo-notifications + Convex).
</content>
</invoke>
