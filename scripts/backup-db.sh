#!/usr/bin/env sh

set -eu

if [ -z "${DATABASE_DIRECT_URL:-}" ]; then
  echo "DATABASE_DIRECT_URL is required." >&2
  exit 1
fi

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
      echo "DATABASE_DIRECT_URL must use a postgres:// or postgresql:// scheme." >&2
      exit 1
      ;;
  esac

  stripped="${url#*://}"
  if [ "$stripped" = "$url" ]; then
    echo "DATABASE_DIRECT_URL must include a postgres:// or postgresql:// scheme." >&2
    exit 1
  fi

  userinfo="${stripped%%@*}"
  hostpath="${stripped#*@}"
  if [ "$userinfo" = "$stripped" ] || [ -z "$userinfo" ]; then
    echo "DATABASE_DIRECT_URL must include username and password." >&2
    exit 1
  fi

  hostport="${hostpath%%/*}"
  dbquery="${hostpath#*/}"
  if [ "$dbquery" = "$hostpath" ] || [ -z "$dbquery" ]; then
    echo "DATABASE_DIRECT_URL must include a database name." >&2
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
    echo "DATABASE_DIRECT_URL must include a password." >&2
    exit 1
  fi
  if [ "$PGPORT" = "$hostport" ]; then
    PGPORT="5432"
  fi
  if [ -n "$query" ]; then
    PGSSLMODE="$(query_param "sslmode" "$query" || true)"
  fi

  export PGUSER PGPASSWORD PGHOST PGPORT PGDATABASE
  if [ -n "${PGSSLMODE:-}" ]; then
    export PGSSLMODE
  fi
}

parse_database_url "$DATABASE_DIRECT_URL"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

timestamp="$(date +%Y%m%d_%H%M%S)"
output_file="$BACKUP_DIR/backup_${timestamp}.dump"

if pg_dump --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$PGDATABASE" --format=custom --file="$output_file"; then
  echo "Database backup created at $output_file"
else
  status=$?
  echo "Database backup failed." >&2
  exit "$status"
fi
