#!/usr/bin/env sh
# Automated backup wrapper with compression and retention.
# Called by the backup Docker service on a daily schedule.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

log() {
  echo "[$(date -Iseconds)] $1" >> "$LOG_FILE"
}

log "Starting backup..."

if sh "$SCRIPT_DIR/backup-db.sh"; then
  latest=$(ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -1 || true)
  if [ -n "$latest" ]; then
    gzip -f "$latest"
    size=$(du -h "${latest}.gz" | cut -f1)
    log "Backup compressed: ${latest}.gz ($size)"
  else
    log "No dump file found to compress"
  fi
else
  log "BACKUP FAILED"
  sh "$SCRIPT_DIR/alert.sh" "Database Backup Failed" "Daily backup at $(date -Iseconds) did not complete successfully."
  exit 1
fi

pruned=0
for f in $(find "$BACKUP_DIR" -name "*.dump.gz" -mtime +"$RETENTION_DAYS" 2>/dev/null); do
  rm -f "$f"
  pruned=$((pruned + 1))
done

remaining=$(find "$BACKUP_DIR" -name "*.dump.gz" 2>/dev/null | wc -l)
log "Retention: pruned $pruned old backups, $remaining kept (${RETENTION_DAYS}d policy)"
