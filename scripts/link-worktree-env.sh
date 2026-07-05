#!/usr/bin/env bash
# Symlink gitignored env files from the canonical store
# (~/.config/agent-workspace) into the current checkout.
#
# Idempotent and silent when there's nothing to do, so it's safe to run on
# every session start. Called from:
#   - .claude/settings.json hooks (Claude Code worktrees)
#   - .config/wt.toml post-start   (worktrunk worktrees)
#
# Add a line at the bottom when another app grows its own .env.local:
# copy the file into the store first, e.g.
#   cp apps/foo/.env.local ~/.config/agent-workspace/foo.env.local
set -euo pipefail

root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
store="${AGENT_WORKSPACE_ENV_HOME:-$HOME/.config/agent-workspace}"

link_env() {
  local src="$store/$1" dest="$root/$2"
  [ -e "$src" ] || return 0
  if [ ! -e "$dest" ] && [ ! -L "$dest" ]; then
    mkdir -p "$(dirname "$dest")"
    ln -s "$src" "$dest"
    echo "linked $2 -> $src"
  fi
}

link_env root.env.local .env.local
link_env web.env.local apps/web/.env.local
link_env storybook.env.local apps/storybook/.env.local
