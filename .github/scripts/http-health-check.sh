#!/bin/bash
set -euo pipefail

if [ -f "$(dirname "$0")/log-helper.sh" ]; then
  source "$(dirname "$0")/log-helper.sh"
else
  log_info() { echo "[INFO] $1"; }
  log_error() { echo "[ERROR] $1" >&2; }
  log_warn() { echo "[WARN] $1"; }
fi

MAX_RETRIES=${MAX_RETRIES:-5}
RETRY_DELAY=${RETRY_DELAY:-3}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
COMPOSE_CMD="docker compose${COMPOSE_FILE:+ -f $COMPOSE_FILE}"
TARGET_SERVICES="${TARGET_SERVICES:-}"

ALL_SERVICES=(
  api-gateway
  identity-service
  tasks-service
  vk-service
  content-service
  moderation-service
  telegram-service
  im-service
  frontend
  redis
)

check_service() {
  local svc="$1"
  local container
  container=$($COMPOSE_CMD ps -q "$svc" 2>/dev/null || echo "")
  [ -z "$container" ] && { log_warn "$svc: container not found"; return 1; }

  case "$svc" in
    redis)
      $COMPOSE_CMD exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG" && return 0
      ;;
    *-db)
      local user="${svc%-db}"
      user="${user%-service}"
      user="${user#parsevk-}"
      $COMPOSE_CMD exec -T "$svc" pg_isready -U "${user}" 2>/dev/null && return 0
      ;;
    *)
      local retry=0
      while [ $retry -lt $MAX_RETRIES ]; do
        if docker exec "$container" sh -c "
          command -v curl >/dev/null 2>&1 &&
          curl -f -s -m 5 http://localhost:8000/health >/dev/null 2>&1
        " 2>/dev/null; then
          return 0
        fi
        retry=$((retry + 1))
        [ $retry -lt $MAX_RETRIES ] && sleep $RETRY_DELAY
      done
      return 1
      ;;
  esac
}

echo "=== HTTP Health Checks ==="
ALL_OK=true

if [ -n "$TARGET_SERVICES" ]; then
  CHECK_SERVICES=()
  for svc in $TARGET_SERVICES; do CHECK_SERVICES+=("$svc"); done
else
  CHECK_SERVICES=("${ALL_SERVICES[@]}")
fi

for svc in "${CHECK_SERVICES[@]}"; do
  if check_service "$svc"; then
    echo "✅ $svc: healthy"
  else
    echo "❌ $svc: unhealthy"
    $COMPOSE_CMD logs --tail=20 "$svc" 2>/dev/null || true
    ALL_OK=false
  fi
done

echo ""
if [ "$ALL_OK" = "true" ]; then
  echo "✅ All health checks passed"
  exit 0
else
  echo "❌ Some health checks failed"
  $COMPOSE_CMD ps 2>/dev/null || true
  exit 1
fi
