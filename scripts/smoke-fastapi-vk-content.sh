#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${GATEWAY_BASE_URL:-http://127.0.0.1:3002}"
USERNAME="${IDENTITY_ADMIN_USERNAME:-admin}"
PASSWORD="${IDENTITY_ADMIN_PASSWORD:-admin-change-me}"
COOKIE_JAR="$(mktemp)"
LOGIN_BODY="$(mktemp)"
TASK_BODY="$(mktemp)"
POSTS_BODY="$(mktemp)"
DETAIL_BODY="$(mktemp)"
trap 'rm -f "$COOKIE_JAR" "$LOGIN_BODY" "$TASK_BODY" "$POSTS_BODY" "$DETAIL_BODY"' EXIT

echo "1. login"
curl -sS -c "$COOKIE_JAR" -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/v1/auth/login" > "$LOGIN_BODY"

ACCESS_TOKEN="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(data.accessToken || data.access_token || '')" "$LOGIN_BODY")"
if [ -z "$ACCESS_TOKEN" ]; then
  echo "missing access token" >&2
  exit 1
fi

echo "2. create task without group selection"
curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"scope":"all","groupIds":[],"postLimit":1,"mode":"recent_posts"}' \
  "$BASE_URL/api/v1/tasks/parse" > "$TASK_BODY"

TASK_ID="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (data.scope !== 'all' || !Array.isArray(data.groupIds) || data.groupIds.length !== 0) process.exit(2); process.stdout.write(String(data.id || ''))" "$TASK_BODY")"
if [ -z "$TASK_ID" ]; then
  echo "missing task id" >&2
  exit 1
fi

echo "3. wait task done"
LAST_STATUS=""
for _ in $(seq 1 30); do
  curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/tasks/$TASK_ID" > "$DETAIL_BODY"
  STATUS="$(node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); process.stdout.write(data.status || '')" "$DETAIL_BODY")"
  if [ "$STATUS" != "$LAST_STATUS" ]; then
    echo "   status=$STATUS"
    LAST_STATUS="$STATUS"
  fi
  if [ "$STATUS" = "done" ]; then
    break
  fi
  sleep 2
done

if [ "${STATUS:-}" != "done" ]; then
  echo "task did not finish, status=${STATUS:-unknown}" >&2
  cat "$DETAIL_BODY" >&2
  exit 1
fi

echo "4. content posts"
curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" "$BASE_URL/api/v1/content/posts?limit=10" > "$POSTS_BODY"
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if (!Array.isArray(data.items) || data.items.length < 1) process.exit(1)" "$POSTS_BODY"

echo "FastAPI VK/content smoke without group selection passed"
