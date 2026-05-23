# @org/web

TanStack Start TODO app with **Clerk** auth and **Convex** backend.

## Environment

All local secrets live in **`apps/web/.env.local`**.

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

| Variable | Where |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard → API keys](https://dashboard.clerk.com/last-active?path=api-keys) |
| `CLERK_SECRET_KEY` | Same page (secret key) |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk → **JWT templates** → template named **`convex`** → Issuer URL |
| `VITE_CONVEX_URL` | Same as `CONVEX_URL` after `pnpm dev:web` writes Convex vars |

Never commit `apps/web/.env.local`.

## Clerk setup (one-time)

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Enable sign-in methods you want (email, Google, etc.).
3. Open **[Convex integration](https://dashboard.clerk.com/apps/setup/convex)** and follow the steps (or manually):
   - Create a JWT template named **`convex`** (Convex docs preset).
   - Copy the template **Issuer** URL into `CLERK_JWT_ISSUER_DOMAIN` in `.env.local`.
4. Copy API keys into `.env.local` (`pk_test_` / `sk_test_` for development).

## Convex setup

From the repo root:

```bash
pnpm dev:web
```

Convex writes `CONVEX_DEPLOYMENT`, `CONVEX_URL`, and `CONVEX_SITE_URL` into `.env.local`. Set `VITE_CONVEX_URL` to match `CONVEX_URL`.

Push Clerk issuer to your Convex deployment:

```bash
pnpm convex:env:sync
```

## Run

```bash
pnpm dev:web
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in** (Clerk modal) → **Open todos**.

## Routes

| Path | Description |
| --- | --- |
| `/` | Home, sign-in / sign-up |
| `/todos` | Authenticated todo list |

Sign-out is via the **User** menu on `/todos` (Clerk `UserButton`).

## Deploy (Cloudflare Workers)

See [docs/DEPLOYMENT.md](../../docs/DEPLOYMENT.md). Quick path:

```bash
pnpm exec wrangler login   # once, from apps/web
pnpm deploy:web            # from repo root (do not use `pnpm deploy` — reserved by pnpm)
```
