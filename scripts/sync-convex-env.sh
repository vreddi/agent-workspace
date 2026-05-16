#!/usr/bin/env bash
# Push WorkOS credentials from apps/web/.env.local to the Convex deployment.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/apps/web/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy from apps/web/.env.local.example" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

cd "$ROOT"
pnpm exec convex env set WORKOS_CLIENT_ID "$WORKOS_CLIENT_ID"
pnpm exec convex env set WORKOS_API_KEY "$WORKOS_API_KEY"
echo "Synced WORKOS_CLIENT_ID and WORKOS_API_KEY to Convex deployment."
