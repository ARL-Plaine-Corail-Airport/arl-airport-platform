#!/usr/bin/env sh
# Uploads the latest compressed database backup to S3-compatible storage.

set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"

if [ -z "${BACKUP_S3_ENDPOINT:-}" ]; then
  echo "BACKUP_S3_ENDPOINT is required." >&2
  exit 1
fi

if [ -z "${BACKUP_S3_BUCKET:-}" ]; then
  echo "BACKUP_S3_BUCKET is required." >&2
  exit 1
fi

latest="$(ls -t "$BACKUP_DIR"/*.dump.gz 2>/dev/null | head -1 || true)"
if [ -z "$latest" ]; then
  echo "No backup to upload"
  exit 0
fi

case "$BACKUP_S3_BUCKET" in
  s3://*)
    destination="$BACKUP_S3_BUCKET"
    ;;
  *)
    destination="s3://$BACKUP_S3_BUCKET/"
    ;;
esac

case "$destination" in
  */) ;;
  *) destination="$destination/" ;;
esac

aws --endpoint-url "$BACKUP_S3_ENDPOINT" s3 cp "$latest" "$destination"
aws --endpoint-url "$BACKUP_S3_ENDPOINT" s3 cp "$latest" "${destination}latest.dump.gz"
echo "Uploaded $latest to $destination and ${destination}latest.dump.gz"
