#!/bin/sh
# Create initial Prisma migration from current schema (run once before first production deploy)
set -e

cd "$(dirname "$0")/.."

if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "Migrations already exist. Use: pnpm migrate:dev"
  exit 0
fi

echo "Creating initial migration..."
pnpm exec prisma migrate dev --name init --create-only
echo "Review prisma/migrations, then run: pnpm migrate:deploy"
