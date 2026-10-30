#!/usr/bin/env bash
# Registers the app's webhook at Pluggy (FIN-OF-06). Run once per public URL.
#
#   PLUGGY_CLIENT_ID=... PLUGGY_CLIENT_SECRET=... PLUGGY_WEBHOOK_SECRET=... \
#     tbfernandes-backend/scripts/pluggy-register-webhook.sh https://your-host/api/v1/webhooks/pluggy
#
# Pluggy needs a public HTTPS URL (for local tests, a tunnel such as ngrok). Pluggy does not sign
# webhooks: it sends back the X-Webhook-Secret header set here, which the API compares with its
# PLUGGY_WEBHOOK_SECRET. Generate one with: openssl rand -hex 32
set -euo pipefail

url="${1:?usage: pluggy-register-webhook.sh <public https url>}"
: "${PLUGGY_CLIENT_ID:?}" "${PLUGGY_CLIENT_SECRET:?}" "${PLUGGY_WEBHOOK_SECRET:?}"
base="${PLUGGY_BASE_URL:-https://api.pluggy.ai}"

api_key=$(curl -fsS "$base/auth" -H 'Content-Type: application/json' \
  -d "{\"clientId\": \"$PLUGGY_CLIENT_ID\", \"clientSecret\": \"$PLUGGY_CLIENT_SECRET\"}" |
  sed -E 's/.*"apiKey":"([^"]+)".*/\1/')

curl -fsS "$base/webhooks" -H "X-API-KEY: $api_key" -H 'Content-Type: application/json' -d @- <<EOF
{"event": "all", "url": "$url", "headers": {"X-Webhook-Secret": "$PLUGGY_WEBHOOK_SECRET"}}
EOF
echo
