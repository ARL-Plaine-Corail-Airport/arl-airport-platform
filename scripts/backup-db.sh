#!/usr/bin/env sh

set -eu

if [ -z "${DATABASE_DIRECT_URL:-}" ]; then
  echo "DATABASE_DIRECT_URL is required." >&2
  exit 1
fi

mkdir -p ./backups

timestamp="$(date +%Y%m%d_%H%M%S)"
output_file="./backups/backup_${timestamp}.dump"

if pg_dump "$DATABASE_DIRECT_URL" --format=custom --file="$output_file"; then
  echo "Database backup created at $output_file"
else
  status=$?
  echo "Database backup failed." >&2
  exit "$status"
fi
