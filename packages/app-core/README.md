# @org/app-core

Cross-platform, **headless** view-model helpers shared by the web app
(`apps/web`) and the Expo mobile app (`apps/mobile`). Pure functions and
plain types only — no React, no DOM, no Convex. The apps own rendering; this
package owns the vocabulary they render.

Consumed straight from source the same way `@org/theme` is: add
`"@org/app-core": "workspace:*"` and import. Web resolves it through the
`@org/source` export condition; Metro/tsc resolve it through the default
condition. Both land on `src/`.

## Modules

| Module | Exports |
| --- | --- |
| `format` | `hashString`, `pick`, `fmtDateBadge`, `formatDays` |
| `deadlines` | `DAY_MS`, `startOfToday`, `addDays`, `daysFromToday`, `formatDue`, `formatDateLong`, `fmtCountdown`, `describeDeadline` |
| `people` | `Tone`, `TONE_LIST`, `TONE_STYLES`, `toneFor`, `AssigneeLike`, `DisplayAssignee`, `toDisplayAssignees`, `initialsFromName`, `firstName`, `greetingFor`, `greetingForHour` |
| `tasks` | `TaskLike`, `TaskStatus`, `SourceKind`, `TaskSource`, `sourceFor`, `deriveDeadline`, `aiSuggestionFor`, `DisplayTask`, `toDisplayTask`, `sortForToday`, `applyFilter`, `FILTER_IDS`, `FilterId` |
| `goals` | `GoalTypeInput`, `goalTypeValue`, `TypeSelection`, `parseTypeValue`, `GOAL_TYPE_COLOR_TOKENS`, `GoalTypeColorToken` |

Everything is re-exported from the package root (`@org/app-core`).

## Structural types

The task/goal helpers accept locally-defined structural shapes
(`TaskLike`, `AssigneeLike`, `GoalTypeInput`, …) rather than backend types, so
the package stays free of any Convex dependency. Backend rows (e.g.
`TaskListItem`) satisfy these shapes structurally; generic helpers like
`toDisplayTask<TRaw>` and `parseTypeValue<TId>` preserve the caller's precise
types (including branded ids) on the way out.

## Scripts

- `pnpm build` — bundle to `dist/` with tsdown (for publishing/CI).
- `pnpm test` — run the vitest suite.
