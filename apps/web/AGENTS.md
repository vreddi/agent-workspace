# apps/web

TanStack Start app (React 19, Clerk auth, Convex data, Tailwind v4),
deployed to **Cloudflare Workers**. Root conventions live in the repo-root
`AGENTS.md`; this file is web-only gotchas.

- **Routes** are file-based under `src/routes/`. `src/routeTree.gen.ts` is
  **generated** by the TanStack router plugin — never hand-edit it (it's
  gitignored / regenerated on dev/build).
- **Dev server runs on port 3000.** Start with `pnpm dev:web` from the repo
  root (boots Convex + Vite together); don't run `vite` bare.
- **Vite `resolve.conditions` gotcha.** Adding the `@org/source` condition
  (to resolve `@worldkit/*` to TS source) _replaces_ Vite's defaults, so
  `vite.config.ts` spreads `defaultClientConditions` /
  `defaultServerConditions` back in for both client and SSR. Keep that when
  touching conditions.
- **`use-sync-external-store` shim patch.** `vite.config.ts` has a
  `fix-use-sync-external-store-shim` plugin that re-exports React 19's native
  `useSyncExternalStore`. Without it Vite's cjs lexer never synthesizes the
  named export, hydration aborts, and Clerk's `<SignInButton>` handler never
  attaches. Don't remove it.
- **Env vars** live in `apps/web/.env.local` (Clerk + Convex); `src/env.ts`
  validates them at build start. See `apps/web/README.md`.
- **Deploy:** `pnpm deploy:web` (= `vite build && wrangler deploy`). Use
  `deploy:web`, not `pnpm deploy` (reserved by pnpm). See `docs/deployment.md`.
- **UI:** compose shadcn/Radix from `@org/ui`; web tokens are the CSS custom
  properties in `src/components/today/styles.ts` (the app's design source of
  truth — see the theme note in the root `AGENTS.md`).
