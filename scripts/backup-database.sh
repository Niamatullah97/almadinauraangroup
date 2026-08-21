#!/bin/sh
# Backup Kabootar PostgreSQL database
# Usage: ./scripts/backup-database.sh [output_dir]
set -e

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILENAME="kabootar_${TIMESTAMP}.sql.gz"
CONTAINER="${POSTGRES_CONTAINER:-kabootar-postgres}"

mkdir -p "$OUTPUT_DIR"

docker exec "$CONTAINER" pg_dump \
  -U "${POSTGRES_USER:-kabootar}" \
  "${POSTGRES_DB:-kabootar}" | gzip > "${OUTPUT_DIR}/${FILENAME}"

echo "Backup saved to ${OUTPUT_DIR}/${FILENAME}"
