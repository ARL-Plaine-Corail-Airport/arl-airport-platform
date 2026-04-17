#!/usr/bin/env sh
# Sends an alert notification via webhook (Discord, Slack, or generic).
# Usage: ./scripts/alert.sh "Alert title" "Alert message body"
#
# Requires: ALERT_WEBHOOK_URL env var (Discord or Slack incoming webhook).
# If ALERT_WEBHOOK_URL is not set, the alert is only logged to stderr.
set -eu

TITLE="${1:-Alert}"
MESSAGE="${2:-No details provided}"
WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"
HOSTNAME="${HOSTNAME:-$(hostname 2>/dev/null || echo 'unknown')}"

timestamp=$(date -Iseconds 2>/dev/null || date)

echo "[$timestamp] ALERT: $TITLE - $MESSAGE" >&2

if [ -z "$WEBHOOK_URL" ]; then
  echo "[$timestamp] ALERT_WEBHOOK_URL not set - alert logged only" >&2
  exit 0
fi

# Discord and Slack both accept a JSON body with "content" (Discord) or "text" (Slack).
# This payload is compatible with both via Discord's webhook format.
# For Slack, use the Slack-specific format if needed.
payload=$(cat <<ENDJSON
{
  "content": "**[$HOSTNAME] $TITLE**\n$MESSAGE\n_$timestamp_"
}
ENDJSON
)

curl -sf -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$payload" > /dev/null 2>&1 || {
  echo "[$timestamp] Failed to send webhook alert" >&2
}
