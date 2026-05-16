# @org/web

TanStack Start web client for the TODO app.

## WorkOS AuthKit (local dev)

Authentication uses [@workos/authkit-tanstack-react-start](https://github.com/workos/authkit-tanstack-start) (server sessions + AuthKit hosted UI).

### 1. WorkOS dashboard

1. Create or open a project at [dashboard.workos.com](https://dashboard.workos.com).
2. Enable **AuthKit** for the environment (Staging is fine for local dev).
3. Copy **Client ID** and **API Key** (`sk_test_…` for staging).
4. Under **Redirects** ([dashboard.workos.com/redirects](https://dashboard.workos.com/redirects)):
   - **Redirect URI:** `http://localhost:3000/api/auth/callback`
   - **Sign-in endpoint:** `http://localhost:3000/api/auth/sign-in`
   - **Sign-out redirect:** `http://localhost:3000/`
5. Enable at least one auth method under AuthKit (email, Google, etc.).

### 2. Environment

Environment variables are validated at startup with [@t3-oss/env-core](https://env.t3.gg) + Zod (`apps/web/src/env.ts`). Invalid or missing values fail fast with a clear error.

From the repo root:

```bash
cp apps/web/.env.example apps/web/.env
```

Fill in:

| Variable | Source |
| --- | --- |
| `WORKOS_CLIENT_ID` | Dashboard → API Keys |
| `WORKOS_API_KEY` | Dashboard → API Keys |
| `WORKOS_REDIRECT_URI` | Must match redirect URI above |
| `WORKOS_COOKIE_PASSWORD` | `openssl rand -base64 24` (32+ chars) |

Never commit `apps/web/.env`.

### 3. Convex

From the **repo root** (first time or after pulling):

```bash
pnpm exec convex dev --once
```

Copy `CONVEX_URL` from `.env.local` into `apps/web/.env` as `VITE_CONVEX_URL` (or run the dev script below, which starts Convex automatically).

Set `WORKOS_CLIENT_ID` on the Convex deployment (done automatically if you use `pnpm dev:web` after configuring WorkOS in `apps/web/.env`):

```bash
# one-time, from repo root (loads apps/web/.env)
set -a && . apps/web/.env && set +a && pnpm exec convex env set WORKOS_CLIENT_ID "$WORKOS_CLIENT_ID"
```

### 4. Run

```bash
# repo root — Convex + Vite together
pnpm dev:web

# or web only (Convex must already be running)
pnpm --filter @org/web dev
```

Open [http://localhost:3000](http://localhost:3000). **Sign in** redirects to WorkOS; after login you land back on `/`. **Todos** (`/todos`) is behind the `_authenticated` layout.

### Auth routes

| Path | Role |
| --- | --- |
| `/api/auth/sign-in` | Starts sign-in (set as WorkOS sign-in endpoint) |
| `/api/auth/sign-up` | Starts sign-up |
| `/api/auth/callback` | OAuth callback (WorkOS redirect target) |
| `/logout` | Ends session via WorkOS |
| `/_authenticated/*` | Requires signed-in user (e.g. `/todos`) |

Server helpers are re-exported from `src/lib/auth.ts` so future clients can use a shared `@org/auth` package without coupling to TanStack Start.
