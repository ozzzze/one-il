#!/usr/bin/env bash
# Run ON the VPS (SSH) when dev machine cannot reach Postgres or has no password in .env.
# Typical self-hosted Supabase: Postgres in Docker service "db".
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/supabase/migrations/20260518140000_notifications_outbox.sql"

if command -v docker >/dev/null 2>&1; then
  if docker compose ps db 2>/dev/null | grep -q running; then
    docker compose exec -T db psql -U postgres -d postgres -f - <"$SQL"
    docker compose exec -T db psql -U postgres -d postgres -c "NOTIFY pgrst, 'reload schema';"
    echo "Applied via docker compose (db service)."
    exit 0
  fi
fi

if command -v psql >/dev/null 2>&1; then
  psql -U postgres -d postgres -f "$SQL"
  psql -U postgres -d postgres -c "NOTIFY pgrst, 'reload schema';"
  echo "Applied via local psql."
  exit 0
fi

echo "No docker compose db or psql found. Paste SQL manually in Studio, then: NOTIFY pgrst, 'reload schema';"
exit 1
