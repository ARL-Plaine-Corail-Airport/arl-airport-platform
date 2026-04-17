#!/usr/bin/env sh
# Health probe for cron-based uptime monitoring.
# On failure, sends an alert via webhook (if ALERT_WEBHOOK_URL is set).
#
# Add to crontab:
# */5 * * * * /opt/arl-airport-platform/scripts/health-probe.sh >> /var/log/arl-health.log 2>&1
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
HEALTH_URL="${HEALTH_URL:-https://localhost/api/health?deep=true}"
STATUS_URL="${STATUS_URL:-}"
STATUS_TOKEN="${STATUS_SECRET:-}"

response=$(curl -ksf --max-time 10 "$HEALTH_URL") || {
  echo "[$(date -Iseconds)] ALERT: Health check failed" >&2
  sh "$SCRIPT_DIR/alert.sh" "Health Check Failed" "GET $HEALTH_URL returned an error or timed out."
  exit 1
}

echo "[$(date -Iseconds)] OK: $response"

# Optional: also check /api/status for per-service health
if [ -n "$STATUS_URL" ] && [ -n "$STATUS_TOKEN" ]; then
  status_response=$(curl -ksf --max-time 10 \
    -H "Authorization: Bearer $STATUS_TOKEN" \
    "$STATUS_URL" 2>/dev/null) || true

  if [ -n "$status_response" ]; then
    # Check if any service is degraded or unhealthy
    status_value=$(echo "$status_response" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$status_value" = "degraded" ] || [ "$status_value" = "unhealthy" ]; then
      echo "[$(date -Iseconds)] WARNING: Status endpoint reports $status_value" >&2
      sh "$SCRIPT_DIR/alert.sh" "Service $status_value" "$status_response"
    fi
  fi
fi
