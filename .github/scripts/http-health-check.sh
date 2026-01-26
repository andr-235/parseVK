#!/bin/bash
set -euo pipefail

# Source logging helper if available
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
COMPOSE_CMD="docker compose"
if [ -n "${COMPOSE_FILE:-}" ]; then
  COMPOSE_CMD="docker compose -f $COMPOSE_FILE"
fi

TARGET_SERVICES=${TARGET_SERVICES:-}
FULL_DEPLOY=${FULL_DEPLOY:-false}
if [ "$FULL_DEPLOY" = "true" ]; then
  TARGET_SERVICES=""
fi
CHECK_API=true
CHECK_FRONTEND=true

if [ -n "$TARGET_SERVICES" ]; then
  CHECK_API=false
  CHECK_FRONTEND=false
  for svc in $TARGET_SERVICES; do
    if [ "$svc" = "api" ]; then
      CHECK_API=true
    fi
    if [ "$svc" = "frontend" ]; then
      CHECK_FRONTEND=true
    fi
  done
fi

if ! command -v curl > /dev/null 2>&1; then
  echo "Error: curl is not installed on the host"
  exit 1
fi

API_CONTAINER=$($COMPOSE_CMD ps -q api 2>/dev/null || echo "")
FRONTEND_CONTAINER=$($COMPOSE_CMD ps -q frontend 2>/dev/null || echo "")

check_api() {
  local retry=0
  while [ $retry -lt $MAX_RETRIES ]; do
    if [ -n "$API_CONTAINER" ]; then
      if docker exec "$API_CONTAINER" sh -c "command -v curl > /dev/null 2>&1 && curl -f -s -m 10 http://localhost:3000/api/health > /dev/null 2>&1 || wget -q -O- --timeout=10 http://localhost:3000/api/health > /dev/null 2>&1" 2>/dev/null; then
        echo "✅ API health check passed (via container)"
        return 0
      fi
    fi
    
    if curl -f -s -m 10 http://localhost:3000/api/health > /dev/null 2>&1; then
      echo "✅ API health check passed (via localhost)"
      return 0
    fi
    
    retry=$((retry + 1))
    if [ $retry -lt $MAX_RETRIES ]; then
      echo "⚠️ API health check failed, retry $retry/$MAX_RETRIES in ${RETRY_DELAY}s..."
      sleep $RETRY_DELAY
    fi
  done
  echo "❌ API health check failed after $MAX_RETRIES attempts"
  return 1
}

check_frontend() {
  local retry=0
  while [ $retry -lt $MAX_RETRIES ]; do
    if [ -n "$FRONTEND_CONTAINER" ]; then
      if docker exec "$FRONTEND_CONTAINER" sh -c "command -v curl > /dev/null 2>&1 && curl -f -s -m 10 http://localhost:80 > /dev/null 2>&1 || wget -q -O- --timeout=10 http://localhost:80 > /dev/null 2>&1" 2>/dev/null; then
        echo "✅ Frontend health check passed (via container)"
        return 0
      fi
    fi
    
    retry=$((retry + 1))
    if [ $retry -lt $MAX_RETRIES ]; then
      echo "⚠️ Frontend health check failed, retry $retry/$MAX_RETRIES in ${RETRY_DELAY}s..."
      sleep $RETRY_DELAY
    fi
  done
  echo "❌ Frontend health check failed after $MAX_RETRIES attempts"
  return 1
}

echo "=== Health Checks ==="

API_OK=false
FRONTEND_OK=false

if [ "$CHECK_API" = "true" ]; then
  if check_api; then
    API_OK=true
  else
    echo "API health check failed. Container logs:"
    $COMPOSE_CMD logs --tail=20 api 2>/dev/null || true
  fi
else
  echo "Skipping API health check (not in target services)"
  API_OK=true
fi

if [ "$CHECK_FRONTEND" = "true" ]; then
  if check_frontend; then
    FRONTEND_OK=true
  else
    echo "Frontend health check failed. Container logs:"
    $COMPOSE_CMD logs --tail=20 frontend 2>/dev/null || true
  fi
else
  echo "Skipping Frontend health check (not in target services)"
  FRONTEND_OK=true
fi

echo ""
echo "=== Container logs (last 30 lines) ==="
if [ -n "$TARGET_SERVICES" ]; then
  $COMPOSE_CMD logs --tail=30 $TARGET_SERVICES
else
  $COMPOSE_CMD logs --tail=30
fi

if [ "$API_OK" != "true" ] || [ "$FRONTEND_OK" != "true" ]; then
  echo ""
  echo "=== Container status ==="
  if [ -n "$TARGET_SERVICES" ]; then
    $COMPOSE_CMD ps $TARGET_SERVICES
  else
    $COMPOSE_CMD ps
  fi
  echo ""
  echo "❌ Health checks failed"
  exit 1
fi

echo ""
echo "✅ All health checks passed"
