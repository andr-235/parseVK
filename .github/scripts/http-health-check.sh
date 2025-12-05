#!/bin/bash
set -euo pipefail

MAX_RETRIES=${MAX_RETRIES:-5}
RETRY_DELAY=${RETRY_DELAY:-3}

if ! command -v curl > /dev/null 2>&1; then
  echo "Error: curl is not installed on the host"
  exit 1
fi

API_CONTAINER=$(docker compose ps -q api 2>/dev/null || echo "")
FRONTEND_CONTAINER=$(docker compose ps -q frontend 2>/dev/null || echo "")

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
    
    if curl -f -s -m 10 http://localhost:8080 > /dev/null 2>&1; then
      echo "✅ Frontend health check passed (via localhost)"
      return 0
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

if check_api; then
  API_OK=true
else
  echo "API health check failed. Container logs:"
  docker compose logs --tail=20 api 2>/dev/null || true
fi

if check_frontend; then
  FRONTEND_OK=true
else
  echo "Frontend health check failed. Container logs:"
  docker compose logs --tail=20 frontend 2>/dev/null || true
fi

echo ""
echo "=== Container logs (last 30 lines) ==="
docker compose logs --tail=30

if [ "$API_OK" != "true" ] || [ "$FRONTEND_OK" != "true" ]; then
  echo ""
  echo "=== Container status ==="
  docker compose ps
  echo ""
  echo "❌ Health checks failed"
  exit 1
fi

echo ""
echo "✅ All health checks passed"

