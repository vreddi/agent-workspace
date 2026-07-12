# scripts

Repo maintenance scripts. Run them via the root `package.json` script or
directly with `bash`.

## `link-worktree-env.sh`

Symlinks the gitignored `.env.local` files from the canonical store
(`~/.config/agent-workspace`, overridable via `AGENT_WORKSPACE_ENV_HOME`)
into the current checkout so every worktree shares one set of secrets.

It resolves the checkout root with `git rev-parse --show-toplevel`, then
links (only when the destination is absent) each known env file:

| Store file | Linked to |
| --- | --- |
| `root.env.local` | `.env.local` |
| `web.env.local` | `apps/web/.env.local` |
| `storybook.env.local` | `apps/storybook/.env.local` |
| `mobile/.env.local` | `apps/mobile/.env.local` |

Idempotent and silent when there's nothing to do, so it's safe to run on
every session start. It's wired into `.claude/settings.json` hooks (Claude
Code worktrees) and `.config/wt.toml` `post-start` (worktrunk worktrees);
run it by hand on a worktree created before those hooks existed. To add a
new app's env file, copy it into the store first
(`cp apps/foo/.env.local ~/.config/agent-workspace/foo.env.local`) and add
a `link_env` line at the bottom of the script.

## `sync-convex-clerk-env.sh`

Pushes the Clerk JWT issuer domain to the Convex deployment so Convex can
verify Clerk-issued tokens. Run it via the root script:

```sh
pnpm convex:env:sync
```

It sources `apps/web/.env.local`, requires `CLERK_JWT_ISSUER_DOMAIN` (the
issuer URL of the Clerk JWT template named `convex`), and runs
`convex env set CLERK_JWT_ISSUER_DOMAIN <value>`. It fails with a helpful
message if the env file or the variable is missing.
