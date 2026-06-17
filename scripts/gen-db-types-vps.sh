#!/usr/bin/env bash
# Run ON VPS (or via: pnpm db:types:remote)
set -euo pipefail

DOCKER_DIR="${SUPABASE_DOCKER_DIR:-/root/supabase/docker}"
TENANT="${POOLER_TENANT_ID:-srv1663763}"

POSTGRES_PASSWORD="$(grep -m1 '^POSTGRES_PASSWORD=' "$DOCKER_DIR/.env" | cut -d= -f2- | tr -d '"\r')"
if [[ -z "$POSTGRES_PASSWORD" ]]; then
  echo "POSTGRES_PASSWORD not found in $DOCKER_DIR/.env" >&2
  exit 1
fi

export PGSSLMODE=disable
DB_URL="postgresql://postgres.${TENANT}:${POSTGRES_PASSWORD}@127.0.0.1:6543/postgres?sslmode=disable"

supabase gen types \
  --lang typescript \
  --db-url "$DB_URL" \
  --schema public \
  --schema one_il \
  --schema one_leave
