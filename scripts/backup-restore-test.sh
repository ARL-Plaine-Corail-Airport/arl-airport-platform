#!/usr/bin/env sh
# Downloads the latest S3 backup and verifies it can be restored.

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
RESTORE_DB_NAME="${RESTORE_TEST_DATABASE_NAME:-arl_restore_test}"
TMP_ROOT="${TMPDIR:-/tmp}"
TMP_DIR="$TMP_ROOT/arl-backup-restore-test.$$"
CREATED_DB=0

url_decode() {
  awk -v value="$1" '
    function hexvalue(char) {
      return index("0123456789ABCDEF", toupper(char)) - 1
    }
    BEGIN {
      while (match(value, /%[0-9A-Fa-f][0-9A-Fa-f]/)) {
        printf "%s%c", substr(value, 1, RSTART - 1), hexvalue(substr(value, RSTART + 1, 1)) * 16 + hexvalue(substr(value, RSTART + 2, 1))
        value = substr(value, RSTART + 3)
      }
      printf "%s", value
    }
  '
}

query_param() {
  key="$1"
  query="$2"

  old_ifs=$IFS
  IFS='&'
  for pair in $query; do
    IFS=$old_ifs
    name="${pair%%=*}"
    value="${pair#*=}"
    if [ "$name" = "$key" ] && [ "$value" != "$pair" ]; then
      url_decode "$value"
      IFS=$old_ifs
      return 0
    fi
  done
  IFS=$old_ifs
  return 1
}

parse_database_url() {
  url="$1"
  scheme="${url%%:*}"
  case "$scheme" in
    postgres|postgresql) ;;
    *)
      echo "Database URL must use a postgres:// or postgresql:// scheme." >&2
      exit 1
      ;;
  esac

  stripped="${url#*://}"
  if [ "$stripped" = "$url" ]; then
    echo "Database URL must include a postgres:// or postgresql:// scheme." >&2
    exit 1
  fi

  userinfo="${stripped%%@*}"
  hostpath="${stripped#*@}"
  if [ "$userinfo" = "$stripped" ] || [ -z "$userinfo" ]; then
    echo "Database URL must include username and password." >&2
    exit 1
  fi

  hostport="${hostpath%%/*}"
  dbquery="${hostpath#*/}"
  if [ "$dbquery" = "$hostpath" ] || [ -z "$dbquery" ]; then
    echo "Database URL must include a database name." >&2
    exit 1
  fi

  query=""
  case "$dbquery" in
    *\?*)
      query="${dbquery#*\?}"
      dbname="${dbquery%%\?*}"
      ;;
    *)
      dbname="$dbquery"
      ;;
  esac

  PGUSER="$(url_decode "${userinfo%%:*}")"
  PGPASSWORD="$(url_decode "${userinfo#*:}")"
  PGHOST="${hostport%%:*}"
  PGPORT="${hostport#*:}"
  PGDATABASE="$(url_decode "$dbname")"

  if [ -z "$PGPASSWORD" ] || [ "$PGPASSWORD" = "$PGUSER" ]; then
    echo "Database URL must include a password." >&2
    exit 1
  fi
  if [ "$PGPORT" = "$hostport" ]; then
    PGPORT="5432"
  fi
  PGSSLMODE=""
  if [ -n "$query" ]; then
    PGSSLMODE="$(query_param "sslmode" "$query" || true)"
  fi

  export PGUSER PGPASSWORD PGHOST PGPORT PGDATABASE
  if [ -n "$PGSSLMODE" ]; then
    export PGSSLMODE
  else
    unset PGSSLMODE
  fi
}

psql_cmd() {
  psql --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$PGDATABASE" -v ON_ERROR_STOP=1 "$@"
}

pg_restore_cmd() {
  pg_restore --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$PGDATABASE" "$@"
}

drop_restore_db() {
  dropdb --if-exists --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" "$RESTORE_DB_NAME"
}

finish() {
  status=$?
  cleanup_status=0
  trap - EXIT INT TERM

  if [ "$CREATED_DB" -eq 1 ]; then
    drop_restore_db || cleanup_status=$?
  fi
  rm -rf "$TMP_DIR"

  if [ "$status" -eq 0 ] && [ "$cleanup_status" -ne 0 ]; then
    status=$cleanup_status
  fi
  if [ "$status" -ne 0 ]; then
    sh "$SCRIPT_DIR/alert.sh" "Database Backup Restore Test Failed" "Backup restore test at $(date -Iseconds) did not complete successfully."
  fi
  exit "$status"
}

trap finish EXIT INT TERM

if [ -z "${BACKUP_S3_ENDPOINT:-}" ]; then
  echo "BACKUP_S3_ENDPOINT is required." >&2
  exit 1
fi

if [ -z "${BACKUP_S3_BUCKET:-}" ]; then
  echo "BACKUP_S3_BUCKET is required." >&2
  exit 1
fi

command -v aws >/dev/null 2>&1 || { echo "aws CLI is required." >&2; exit 1; }
command -v gunzip >/dev/null 2>&1 || { echo "gunzip is required." >&2; exit 1; }
command -v pg_restore >/dev/null 2>&1 || { echo "pg_restore is required." >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "psql is required." >&2; exit 1; }

mkdir -p "$TMP_DIR"

case "$BACKUP_S3_BUCKET" in
  s3://*)
    bucket_uri="$BACKUP_S3_BUCKET"
    ;;
  *)
    bucket_uri="s3://$BACKUP_S3_BUCKET/"
    ;;
esac

case "$bucket_uri" in
  */) ;;
  *) bucket_uri="$bucket_uri/" ;;
esac

compressed_dump="$TMP_DIR/latest.dump.gz"
dump_file="$TMP_DIR/latest.dump"
latest_key="latest.dump.gz"

aws --endpoint-url "$BACKUP_S3_ENDPOINT" s3 cp "${bucket_uri}${latest_key}" "$compressed_dump"
gunzip -c "$compressed_dump" > "$dump_file"

if [ -n "${RESTORE_TEST_DATABASE_URL:-}" ]; then
  parse_database_url "$RESTORE_TEST_DATABASE_URL"
else
  if [ -z "${DATABASE_DIRECT_URL:-}" ]; then
    echo "DATABASE_DIRECT_URL or RESTORE_TEST_DATABASE_URL is required." >&2
    exit 1
  fi
  command -v createdb >/dev/null 2>&1 || { echo "createdb is required." >&2; exit 1; }
  command -v dropdb >/dev/null 2>&1 || { echo "dropdb is required." >&2; exit 1; }
  parse_database_url "$DATABASE_DIRECT_URL"
  drop_restore_db
  createdb --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" "$RESTORE_DB_NAME"
  CREATED_DB=1
  PGDATABASE="$RESTORE_DB_NAME"
  export PGDATABASE
fi

pg_restore_cmd --clean --if-exists --no-owner --no-privileges "$dump_file"

checked_tables=0
for table in users media documents flights notices pages faqs airlines news_events airport_project careers page_views payload_migrations payload_preferences; do
  exists="$(psql_cmd -At -c "select to_regclass('public.$table') is not null")"
  if [ "$exists" = "t" ]; then
    count="$(psql_cmd -At -c "select count(*) from public.$table")"
    echo "$table: $count"
    checked_tables=$((checked_tables + 1))
  fi
done

if [ "$checked_tables" -eq 0 ]; then
  echo "No known key tables found after restore." >&2
  exit 1
fi

echo "Restore test completed from ${bucket_uri}${latest_key} with $checked_tables smoke checks."
