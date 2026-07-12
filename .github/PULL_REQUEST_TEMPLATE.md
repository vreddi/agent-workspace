<!--
Title: use a conventional-commit summary, e.g. `feat(tasks): ...` / `docs: ...`
Base branch: develop
-->

## What & why

<!-- One or two sentences on the change and its motivation. -->

## Checklist

- [ ] PR title is a conventional commit (`feat(scope): ...`, `fix: ...`, `docs: ...`)
- [ ] Targets `develop`
- [ ] `pnpm nx run-many -t test,build,typecheck` passes
- [ ] Schema change? (`convex/schema.ts`) — describe it below and note any migration/backfill
- [ ] Updated relevant docs / package README if public API or architecture changed

## Schema / migration notes

<!-- Delete if no schema change. Otherwise: what changed, and how existing rows are handled. -->
