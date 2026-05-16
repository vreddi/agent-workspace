# @org/web

TanStack Start web client for the TODO app.

## Environment (single file)

All local secrets and URLs live in **`apps/web/.env.local`** (web app + Convex CLI).

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Fill in WorkOS values from [dashboard.workos.com](https://dashboard.workos.com) (Staging).
After the first `pnpm dev:web`, Convex writes `CONVEX_DEPLOYMENT`, `CONVEX_URL`, and
`CONVEX_SITE_URL` into the same file — set `VITE_CONVEX_URL` to match `CONVEX_URL`.

Then sync WorkOS credentials to your Convex deployment:

```bash
pnpm convex:env:sync
```

Never commit `apps/web/.env.local`.

Variables are validated at startup via `src/env.ts` ([@t3-oss/env-core](https://env.t3.gg) + Zod).

| Variable | Where |
| --- | --- |
| `WORKOS_*` | WorkOS dashboard → API Keys & Redirects |
| `WORKOS_COOKIE_PASSWORD` | `openssl rand -base64 24` |
| `CONVEX_*` | Written by `convex dev` into `.env.local` |
| `VITE_CONVEX_URL` | Same URL as `CONVEX_URL` (required for the browser) |

### WorkOS redirects (Staging)

| Setting | Value |
| --- | --- |
| Redirect URI | `http://localhost:3000/api/auth/callback` |
| Sign-in endpoint | `http://localhost:3000/api/auth/sign-in` |
| Sign-out redirect | `http://localhost:3000/` |

## Run

From the **repo root**:

```bash
pnpm dev:web
```

This runs Convex with `--env-file apps/web/.env.local` and starts the Vite app.

Open [http://localhost:3000](http://localhost:3000) → sign in → `/todos`.

## Auth routes

| Path | Role |
| --- | --- |
| `/api/auth/sign-in` | Starts sign-in |
| `/api/auth/sign-up` | Starts sign-up |
| `/api/auth/callback` | OAuth callback |
| `/logout` | Sign out |
| `/_authenticated/*` | Protected (e.g. `/todos`) |
