#!/usr/bin/env bash
# Push Clerk JWT issuer domain from apps/web/.env.local to the Convex deployment.
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

if [[ -z "${CLERK_JWT_ISSUER_DOMAIN:-}" ]]; then
  echo "Set CLERK_JWT_ISSUER_DOMAIN in $ENV_FILE (Clerk JWT template \"convex\" issuer URL)" >&2
  exit 1
fi

cd "$ROOT"
pnpm exec convex env set CLERK_JWT_ISSUER_DOMAIN "$CLERK_JWT_ISSUER_DOMAIN"
echo "Synced CLERK_JWT_ISSUER_DOMAIN to Convex deployment."
