#!/bin/sh
set -eu

if [ -z "${DATABASE_DIRECT_URL:-}" ]; then
  echo "DATABASE_DIRECT_URL is required for page-view retention purge" >&2
  exit 1
fi

RETENTION_DAYS="${PAGE_VIEW_RETENTION_DAYS:-90}"
BATCH_SIZE="${PAGE_VIEW_RETENTION_BATCH_SIZE:-10000}"

case "$RETENTION_DAYS" in
  ''|*[!0-9]*)
    echo "PAGE_VIEW_RETENTION_DAYS must be a positive integer" >&2
    exit 1
    ;;
esac

case "$BATCH_SIZE" in
  ''|*[!0-9]*)
    echo "PAGE_VIEW_RETENTION_BATCH_SIZE must be a positive integer" >&2
    exit 1
    ;;
esac

total_deleted=0

while :; do
  deleted="$(psql "$DATABASE_DIRECT_URL" -v ON_ERROR_STOP=1 -At -c "
WITH doomed AS (
  SELECT id
  FROM page_views
  WHERE created_at < now() - (${RETENTION_DAYS} * interval '1 day')
  ORDER BY created_at
  LIMIT ${BATCH_SIZE}
),
deleted AS (
  DELETE FROM page_views pv
  USING doomed
  WHERE pv.id = doomed.id
  RETURNING 1
)
SELECT COUNT(*)::bigint FROM deleted;
")"

  deleted="${deleted:-0}"
  total_deleted=$((total_deleted + deleted))

  if [ "$deleted" -lt "$BATCH_SIZE" ]; then
    break
  fi
done

echo "Purged ${total_deleted} page-view rows older than ${RETENTION_DAYS} days."
