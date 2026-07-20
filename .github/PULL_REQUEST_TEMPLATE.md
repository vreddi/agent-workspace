<!--
Title: use a conventional-commit summary, e.g. `feat(tasks): ...` / `docs: ...`
Base branch: develop
-->

## What & why

<!-- One or two sentences on the change and its motivation. -->

## Version plan

<!--
Generated with Nx — never hand-written:
  pnpm nx release plan <patch|minor|major> -m "<conventional summary>"
Paste the generated `.nx/version-plans/*.md` filename here, or state why no
plan is needed (e.g. `pnpm nx release plan:check` reports no touched projects).
-->

## Checklist

- [ ] PR title is a conventional commit (`feat(scope): ...`, `fix: ...`, `docs: ...`)
- [ ] **Every commit** on the branch is a conventional commit, not just the title
- [ ] Targets `develop`
- [ ] Version plan generated via `pnpm nx release plan` (not hand-authored) and committed, or no projects touched
- [ ] `pnpm nx release plan:check` passes
- [ ] `pnpm nx run-many -t test,build,typecheck` passes
- [ ] Schema change? (`convex/schema.ts`) — describe it below and note any migration/backfill
- [ ] Updated relevant docs / package README if public API or architecture changed

## Schema / migration notes

<!-- Delete if no schema change. Otherwise: what changed, and how existing rows are handled. -->
