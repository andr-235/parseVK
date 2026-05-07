#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${GATEWAY_BASE_URL:-http://127.0.0.1:3002}"
USERNAME="${IDENTITY_ADMIN_USERNAME:-admin}"
PASSWORD="${IDENTITY_ADMIN_PASSWORD:-admin-change-me}"
COOKIE_JAR="$(mktemp)"
LOGIN_BODY="$(mktemp)"
TASK_BODY="$(mktemp)"
trap 'rm -f "$COOKIE_JAR" "$LOGIN_BODY" "$TASK_BODY"' EXIT

echo "1. login"
curl -sS -c "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/v1/auth/login" > "$LOGIN_BODY"

ACCESS_TOKEN="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(data.accessToken || data.access_token || '')" "$LOGIN_BODY")"
if [ -z "$ACCESS_TOKEN" ]; then
  echo "missing access token" >&2
  exit 1
fi

echo "2. create task"
curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"scope":"all","groupIds":[1,2],"postLimit":10,"mode":"recent_posts"}' \
  "$BASE_URL/api/v1/tasks/parse" > "$TASK_BODY"

TASK_ID="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (!Array.isArray(data.groupIds) || data.groupIds.length !== 0) process.exit(2); process.stdout.write(String(data.id || ''))" "$TASK_BODY")"
if [ -z "$TASK_ID" ]; then
  echo "missing task id" >&2
  exit 1
fi

echo "3. list"
curl -fsS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks" >/dev/null

echo "4. detail"
curl -fsS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks/$TASK_ID" >/dev/null

echo "5. audit"
curl -fsS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks/$TASK_ID/audit-log" >/dev/null

echo "6. automation settings"
curl -fsS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks/automation/settings" >/dev/null

echo "7. delete"
curl -fsS -X DELETE -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks/$TASK_ID" >/dev/null

echo "FastAPI tasks smoke passed"
