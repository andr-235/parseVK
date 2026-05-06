#!/bin/sh
set -eu

GATEWAY_URL="${GATEWAY_URL:-http://127.0.0.1:3002}"
SMOKE_USERNAME="${SMOKE_USERNAME:-${IDENTITY_ADMIN_USERNAME:-admin}}"
SMOKE_PASSWORD="${SMOKE_PASSWORD:-${IDENTITY_ADMIN_PASSWORD:-admin-change-me}}"
CSRF_COOKIE_NAME="${CSRF_COOKIE_NAME:-${GATEWAY_CSRF_COOKIE_NAME:-csrf_token}}"

COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

json_payload() {
  SMOKE_USERNAME="$SMOKE_USERNAME" SMOKE_PASSWORD="$SMOKE_PASSWORD" python3 - <<'PY'
import json
import os

print(json.dumps({
    "username": os.environ["SMOKE_USERNAME"],
    "password": os.environ["SMOKE_PASSWORD"],
}))
PY
}

json_get() {
  key="$1"
  python3 -c 'import json, sys; print(json.load(sys.stdin)[sys.argv[1]])' "$key"
}

csrf_token() {
  awk -v name="$CSRF_COOKIE_NAME" '$6 == name { value = $7 } END { print value }' "$COOKIE_JAR"
}

echo "1. health"
curl -fsS "$GATEWAY_URL/health" >/dev/null

echo "2. login"
LOGIN_BODY="$(json_payload)"
LOGIN_RESPONSE="$(
  curl -fsS -c "$COOKIE_JAR" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_BODY" \
    "$GATEWAY_URL/api/v1/auth/login"
)"
ACCESS_TOKEN="$(printf '%s' "$LOGIN_RESPONSE" | json_get accessToken)"

echo "3. refresh"
CSRF_TOKEN="$(csrf_token)"
REFRESH_RESPONSE="$(
  curl -fsS -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -X POST \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    "$GATEWAY_URL/api/v1/auth/refresh"
)"
ACCESS_TOKEN="$(printf '%s' "$REFRESH_RESPONSE" | json_get accessToken)"

echo "4. me"
curl -fsS \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$GATEWAY_URL/api/v1/auth/me" >/dev/null

echo "5. logout"
CSRF_TOKEN="$(csrf_token)"
curl -fsS -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
  -X POST \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  "$GATEWAY_URL/api/v1/auth/logout" >/dev/null

echo "FastAPI auth smoke passed"
