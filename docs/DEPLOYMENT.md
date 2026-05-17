# Deployment

How to deploy **`apps/web`** (TODO app) and **`apps/storybook`** (design system docs).

| App | Platform | Why |
| --- | --- | --- |
| `apps/web` | [Cloudflare Workers](https://developers.cloudflare.com/workers/) | TanStack Start SSR + server functions; first-class [TanStack Start guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/) |
| Storybook | [Chromatic](https://www.chromatic.com/) | Hosted Storybook, visual regression, PR review UI — standard for component libraries |

---

## 1. Deploy `apps/web` to Cloudflare Workers

### Cloudflare dashboard setup (step-by-step)

Do this once before your first deploy.

#### A. Account and API token (for GitHub Actions + Wrangler)

1. Sign in at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Open **My Profile** (avatar) → **API Tokens** → **Create Token**.
3. Use the **Edit Cloudflare Workers** template (or custom token with):
   - **Account** → Workers Scripts: **Edit**
   - **Account** → Workers KV / R2 / etc.: only if you add bindings later
4. Create the token and copy it → GitHub secret `CLOUDFLARE_API_TOKEN`.
5. Copy **Account ID** from the Workers overview page (right sidebar) → GitHub secret `CLOUDFLARE_ACCOUNT_ID`.

#### B. First deploy (creates the Worker)

From your machine (after `pnpm exec wrangler login` in `apps/web`):

```bash
pnpm deploy:web
```

Or run the **deploy-web** GitHub Action after secrets are set.

After deploy, Cloudflare creates a Worker named **`org-web-todo`** (see `apps/web/wrangler.jsonc`). Note the URL, e.g.:

`https://org-web-todo.<your-subdomain>.workers.dev`

#### C. Worker environment variables (dashboard)

1. Go to **Workers & Pages** → **org-web-todo** (or your worker name).
2. **Settings** → **Variables and Secrets**.
3. Add **production** values:

| Name | Type | Value |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | Secret | Clerk production `sk_live_...` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Secret (or plain text) | Clerk `pk_live_...` |
| `VITE_CONVEX_URL` | Plain text | `https://<your-prod>.convex.cloud` |

These must match what you use in GitHub Actions secrets for CI deploys.

4. **Save** and **Deploy** (or redeploy from Actions) so the Worker picks up new vars.

> **Build-time vs runtime:** Vite bakes `VITE_*` into the client bundle at **build** time. The GitHub workflow passes them during `vite build`. If you deploy only from the dashboard without rebuilding, ensure your deploy pipeline still supplies `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL` at build time.

#### D. Custom domain (optional)

1. Same worker → **Settings** → **Domains & Routes** → **Add** → **Custom Domain**.
2. Enter e.g. `todo.yourdomain.com` (DNS must be on Cloudflare or add the CNAME they show).
3. Add that exact URL in **Clerk** → **Domains** / allowed origins.

#### E. Observability (optional)

`wrangler.jsonc` already enables observability. In the dashboard: worker → **Logs** / **Analytics** to watch errors after deploy.

#### F. What you do *not* need on Cloudflare for this app

- **Pages** project (separate product) — we use **Workers** for TanStack Start SSR.
- WorkOS redirect URLs — removed; auth is **Clerk** only.
- Convex runs on Convex Cloud, not on Cloudflare (only `VITE_CONVEX_URL` points to it).

---

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (installed via `apps/web` devDependencies)
- Production **Clerk** application (not only dev keys)
- Production **Convex** deployment URL

### One-time: Cloudflare login

```bash
cd apps/web
pnpm exec wrangler login
```

### One-time: Clerk for production

In [Clerk Dashboard](https://dashboard.clerk.com):

1. Use **Production** instance (or promote when ready).
2. Add your Cloudflare URL to allowed origins, e.g.:
   - `https://org-web-todo.<your-subdomain>.workers.dev`
   - `https://todo.yourdomain.com` (custom domain)
3. Ensure JWT template **`convex`** exists; note **Issuer** URL.
4. Set Convex production `CLERK_JWT_ISSUER_DOMAIN` (Convex dashboard or `npx convex env set` for prod deployment).

### One-time: Convex production

Use a separate Convex deployment for production (recommended). Set `VITE_CONVEX_URL` to that deployment’s HTTPS URL.

### Environment variables on Cloudflare

Set **secrets** and **vars** for the Worker. Two options:

**A. Wrangler secrets (CLI)**

From repo root, with production values:

```bash
cd apps/web
pnpm exec wrangler secret put CLERK_SECRET_KEY
pnpm exec wrangler secret put VITE_CLERK_PUBLISHABLE_KEY
pnpm exec wrangler secret put VITE_CONVEX_URL
```

**B. Cloudflare dashboard**

Workers & Pages → your worker → **Settings** → **Variables and Secrets**.

| Variable | Type | Notes |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | Secret | `sk_live_...` for production |
| `VITE_CLERK_PUBLISHABLE_KEY` | Secret or plain | `pk_live_...` — needed at **build** time for Vite |
| `VITE_CONVEX_URL` | Plain | `https://<prod>.convex.cloud` |

For **CI builds**, pass the same `VITE_*` values as environment variables during `vite build` (see GitHub Actions example below). Wrangler/Workers Builds also support `CLOUDFLARE_INCLUDE_PROCESS_ENV=true` so build-time env is available.

### Local preview (production build)

```bash
pnpm --filter @org/web build   # requires env in apps/web/.env.local or SKIP_ENV_VALIDATION=1
pnpm --filter @org/web preview
```

### Deploy from your machine

```bash
pnpm deploy:web
# or: pnpm --filter @org/web deploy
```

This runs `vite build && wrangler deploy` using `apps/web/wrangler.jsonc`.

### Custom domain

Cloudflare dashboard → Worker → **Custom Domains** → add `todo.yourdomain.com`. Update Clerk allowed origins to match.

### CI: GitHub Actions

Workflow: [`.github/workflows/deploy-web.yml`](../.github/workflows/deploy-web.yml)

- **Trigger:** manual only (`workflow_dispatch`) from the Actions tab
- **Source:** always checks out the latest **`develop`** branch, then runs `pnpm deploy` in `apps/web`

Store these **repository secrets**:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | [API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with Workers edit |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard sidebar |
| `CLERK_SECRET_KEY` | Clerk production secret key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (Vite build) |
| `VITE_CONVEX_URL` | Production Convex URL |

**Run:** GitHub → **Actions** → **deploy-web** → **Run workflow**.

### Alternative: Cloudflare Workers Builds

Connect the GitHub repo in the Cloudflare dashboard (Workers Builds). Set build command to `pnpm install && pnpm --filter @org/web build` and deploy command to `cd apps/web && pnpm exec wrangler deploy`. Configure the same env vars in build settings.

---

## 2. Deploy Storybook with Chromatic

Chromatic is the right fit for **`@org/storybook`**: static UI docs, visual diffs on PRs, no need to run a full SSR app.

### Prerequisites

- [Chromatic account](https://www.chromatic.com/) (free tier for open source / small teams)
- GitHub repo connected to Chromatic

### One-time setup

1. Go to [chromatic.com](https://www.chromatic.com/) → **Add project** → select this GitHub repo.
2. Choose **Storybook**; set project name (e.g. `agent-workspace-ui`).
3. Copy the **project token** (`chpt_...`).
4. Add GitHub repository secret: `CHROMATIC_PROJECT_TOKEN`.

### Run locally

```bash
nx run @org/storybook:chromatic
# or from repo root: pnpm chromatic
```

Runs in `apps/storybook` (builds Storybook, then uploads `storybook-static`). Put `CHROMATIC_PROJECT_TOKEN` in `apps/storybook/.env.local` — Chromatic loads `.env` from that directory when the script runs.

Or pass the token explicitly:

```bash
CHROMATIC_PROJECT_TOKEN=chpt_xxx nx run @org/storybook:chromatic
```

### CI

On every PR / push to `develop`, GitHub Actions can publish Storybook and run visual tests. See [`.github/workflows/chromatic.yml`](../.github/workflows/chromatic.yml).

Chromatic will comment on PRs with a link to the hosted Storybook and visual change summary.

Add `.github/workflows/chromatic.yml` (see [GitHub Actions examples](#github-actions-examples) below).

### What Chromatic is not

- Not for deploying `apps/web` (use Cloudflare).
- Not a replacement for Convex or Clerk — Storybook stories should use mocks, not live backends.

---

## Checklist before first production deploy

- [ ] Clerk production keys and domains configured
- [ ] Convex production deployment + `CLERK_JWT_ISSUER_DOMAIN` set on Convex
- [ ] `VITE_CONVEX_URL` points at production Convex
- [ ] Cloudflare Worker secrets / CI env vars set
- [ ] `pnpm deploy:web` succeeds
- [ ] Sign-in and `/todos` work on the live URL
- [ ] Chromatic project connected; `CHROMATIC_PROJECT_TOKEN` in GitHub

## GitHub Actions examples

Create these workflow files when you are ready for CI deploys.

### `chromatic.yml` (optional)

Secrets: `CHROMATIC_PROJECT_TOKEN`.

```yaml
name: chromatic
on:
  pull_request:
    branches: [develop]
  push:
    branches: [develop]
    paths: ['apps/storybook/**', 'packages/**', 'pnpm-lock.yaml']
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Publish to Chromatic
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
        run: nx run @org/storybook:chromatic
```

## Related

- [TECH_STACK.md](./TECH_STACK.md)
- [apps/web/README.md](../apps/web/README.md)
