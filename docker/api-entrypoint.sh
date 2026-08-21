#!/bin/sh
set -e

echo "[kabootar-api] Running database migrations..."
pnpm --filter @kabootar/database migrate:deploy

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  echo "[kabootar-api] Seeding database..."
  pnpm --filter @kabootar/database seed
fi

echo "[kabootar-api] Starting API server..."
exec node apps/api/dist/main.js
