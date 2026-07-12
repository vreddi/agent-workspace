# Mobile / web parity playbook

The web app (`apps/web`) and the Expo app (`apps/mobile`) are two front ends
over one backend. Keeping them in step is cheap if product logic is shared
and expensive if it drifts into each client. This is the maintenance guide:
where code goes, how to add a feature to both clients, and what "done" means.

## Architecture: three shared layers, two thin UIs

Both apps stand on the same three foundations and add only their own
rendering on top:

- **Convex backend (`convex/`) — the single source of truth.** Schema,
  queries, and mutations. All reads and writes, all validation and
  authorization, live here. Neither client duplicates data logic.
- **`@org/theme` — design tokens.** Palettes, spacing, radii, type scale,
  in a form both platforms can read (hex, not `oklch()`). The web maps them
  to Tailwind/CSS; mobile reads them through `useTheme()`.
- **`@org/app-core` — view-model logic.** Pure, headless functions and
  plain types: deadline math/formatting, task display/sort/filter, AI
  suggestion text, people/tone helpers, goal-type value coding. No React,
  no DOM, no Convex. Both clients import it from source.

The apps themselves are thin: they wire Convex hooks to platform-native UI
(React + Tailwind + Radix on web; React Native + the `forms.tsx` kit on
mobile) and nothing more.

```
                     ┌──────────────────────────┐
                     │   Convex backend          │  schema · queries ·
                     │   (single source of truth)│  mutations · auth
                     └────────────┬──────────────┘
                                  │ same deployment
                 ┌────────────────┴────────────────┐
                 │                                  │
       ┌─────────▼─────────┐              ┌─────────▼─────────┐
       │  apps/web (React) │              │ apps/mobile (RN)  │
       │  Tailwind + Radix │              │ forms.tsx + RN    │
       └─────────┬─────────┘              └─────────┬─────────┘
                 │        both import, from source  │
                 └────────────┬─────────────────────┘
                     ┌────────▼────────┐   ┌──────────────────┐
                     │  @org/app-core  │   │    @org/theme    │
                     │ view-model logic│   │  design tokens   │
                     └─────────────────┘   └──────────────────┘
```

## Where logic must live

| Kind of code | Home | Notes |
| --- | --- | --- |
| Pure product logic (formatting, sorting, filtering, derivations, label text) | `@org/app-core` | Pure functions + plain types. No React/DOM/Convex. Cover with vitest. |
| Data access, validation, authorization | `convex/` functions | The only place that touches the database. Both clients call the same functions. |
| Platform UI (components, screens, styling, navigation, gestures) | `apps/web` or `apps/mobile` | Each app owns its own rendering; do not share components across platforms. |
| Design tokens (color, spacing, radius, type) | `@org/theme` | Web and mobile both read these; change the web source and the hex mirror together. |

**The rule:** if you find yourself writing the same non-UI function twice —
once for web, once for mobile — it belongs in `@org/app-core`. A function
that only formats or decides (given plain inputs, returns plain outputs)
is app-core's job; a function that renders or queries is not.

> Accepted structural types, not backend types. app-core helpers take
> local shapes (`TaskLike`, `AssigneeLike`, `GoalTypeInput`, …) so the
> package stays free of any Convex dependency. Backend rows satisfy these
> shapes structurally, and generic helpers like `toDisplayTask<TRaw>` /
> `parseTypeValue<TId>` preserve each caller's precise types (including
> branded ids) on the way out. That is why the web keeps thin re-export
> shims (`apps/web/src/components/today/helpers.ts`,
> `apps/web/src/components/goals/goal-ui.tsx`) that re-export app-core and
> specialize a couple of types to the web's concrete rows.

## Adding a feature end-to-end

Work outward from the backend so both clients build on settled logic:

1. **Schema** — add/adjust tables and indexes in `convex/schema.ts`.
2. **Convex function(s)** — write the query/mutation with argument and
   return validators; put authorization here. Add Convex tests. Read
   `convex/_generated/ai/guidelines.md` first.
3. **`@org/app-core` helpers** — if the feature needs any formatting,
   sorting, or derivation the UI will use, add it here as a pure function
   with a vitest test. Export it from the package root and (for the web)
   from the relevant re-export shim.
4. **Web UI** — build the screen/components in `apps/web` over the Convex
   hooks and app-core helpers.
5. **Mobile UI** — build the matching screen(s) in `apps/mobile`, reusing
   the same Convex functions and app-core helpers (see the mobile notes
   below).
6. **Update the parity checklist** in this doc so the two columns stay
   honest.

### Mobile-specific notes

- **Modal routes.** Create/edit screens are expo-router modals. Register
  top-level ones in `src/app/_layout.tsx` with the presets in
  `src/lib/navigation.ts` (`modalScreenOptions`,
  `headerlessModalScreenOptions`). Sub-routes may instead declare their own
  `Stack.Screen` options in-route (the goal create/edit modals do this) —
  keep `_layout.tsx` focused on the top-level task routes.
- **Form kit first.** Reach for `src/components/forms.tsx` before hand-
  rolling inputs: `FormScreen` (scroll + keyboard-avoidance + sticky
  footer), `FormSection`, `TextFieldRow`, `MultilineFieldRow`, `SelectRow`
  (option sheet), `DateFieldRow` (platform date/time pickers),
  `StepperRow`, `ChipRowGroup`, `FooterButton`, and `confirmDestructive`
  for delete alerts. They are controlled and themed.
- **Styling.** `StyleSheet.create` for static layout; pull every color from
  `useTheme()`'s `palette` and apply it inline. Never hardcode a hex.
  Spacing/radii come from `@org/theme` (`space`, `radius`).
- **Haptics.** Light impact on ordinary taps and stage moves, medium on
  primary/footer actions, and `notificationAsync` success/error on mutation
  resolve/reject — matching the existing task/goal screens.
- **Env inlining.** `EXPO_PUBLIC_*` values are baked in at bundle time.
  After editing `.env.local`, restart with `expo start --clear` or the app
  keeps the stale value.

## Feature-parity checklist

Status of each product feature per client. Keep this current when you ship.

| Feature | Web | Mobile |
| --- | --- | --- |
| Tasks: view / Today agenda | Yes | Yes |
| Tasks: create (quick capture) | Yes | Yes (`task/new`, accepts `?goalId=`) |
| Tasks: edit / status / delete | Yes | Yes (delete is creator-only) |
| Task assignees (with user search) | Yes | Yes |
| Task activity history | Yes | Yes |
| Goals: view + progress | Yes | Yes |
| Goals: create / edit | Yes | Yes |
| Goals: achieve / archive / reactivate / delete | Yes | Yes |
| Goal types (built-in + inline custom creation) | Yes | Yes |
| Goal board: stage moves + attach/detach tasks | Yes | Yes |
| Goal reminders banner | Yes | Yes |
| Per-goal metrics (readings + charts) | Yes | Yes (metric CRUD, log/edit/delete readings, sparkline + progress toward target on goal detail) |
| Settings (theme, prefs) | Yes | Yes (theme + reminders toggle via AsyncStorage) |
| Village canvas | Yes | No — web-only for now (roadmap) |

## Verification

- **Full workspace check** (run from the repo root):

  ```sh
  pnpm nx run-many -t test,build,typecheck
  ```

  This runs the vitest suites (including `@org/app-core`), builds, and
  typechecks every project.

- **Mobile typecheck** — Expo isn't an Nx target the same way; typecheck it
  directly:

  ```sh
  pnpm -C apps/mobile exec tsc --noEmit
  ```

- **Run the app** — from the repo root, `pnpm dev:mobile` (or
  `pnpm mobile:ios` / `pnpm mobile:android`). See
  [mobile-app.md](./mobile-app.md) for simulator setup.

**Caveat: the mobile app has no vitest suite.** Its screens are exercised
by hand, not unit tests. That is the whole reason product logic belongs in
`@org/app-core` — there it *is* tested, once, and both clients inherit the
coverage. When a mobile change tempts you to write a pure helper inside a
screen, move it to app-core with a test instead.
</content>
