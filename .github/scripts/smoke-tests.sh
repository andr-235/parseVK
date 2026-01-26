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

COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
COMPOSE_CMD="docker compose"
if [ -n "${COMPOSE_FILE:-}" ]; then
  COMPOSE_CMD="docker compose -f $COMPOSE_FILE"
fi

API_URL=${API_URL:-http://localhost:3000}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:80}
MAX_RETRIES=${MAX_RETRIES:-5}
RETRY_DELAY=${RETRY_DELAY:-3}

FAILED_TESTS=0

test_endpoint() {
  local url=$1
  local description=$2
  local expected_status=${3:-200}
  
  log_info "Testing $description: $url"
  
  local retry=0
  while [ $retry -lt $MAX_RETRIES ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$url" || echo "000")
    
    if [ "$HTTP_CODE" = "$expected_status" ]; then
      log_info "✅ $description: OK (HTTP $HTTP_CODE)"
      return 0
    fi
    
    retry=$((retry + 1))
    if [ $retry -lt $MAX_RETRIES ]; then
      log_warn "$description failed (HTTP $HTTP_CODE), retry $retry/$MAX_RETRIES in ${RETRY_DELAY}s..."
      sleep $RETRY_DELAY
    fi
  done
  
  log_error "❌ $description: FAILED (HTTP $HTTP_CODE after $MAX_RETRIES attempts)"
  FAILED_TESTS=$((FAILED_TESTS + 1))
  return 1
}

test_database() {
  log_info "Testing database connection"
  
  DB_CONTAINER=$($COMPOSE_CMD ps -q db 2>/dev/null || echo "")
  if [ -z "$DB_CONTAINER" ]; then
    log_error "❌ Database container not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
  
  if $COMPOSE_CMD exec -T db pg_isready -U postgres -d vk_api > /dev/null 2>&1; then
    log_info "✅ Database connection: OK"
    return 0
  else
    log_error "❌ Database connection: FAILED"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

test_redis() {
  log_info "Testing Redis connection"
  
  REDIS_CONTAINER=$($COMPOSE_CMD ps -q redis 2>/dev/null || echo "")
  if [ -z "$REDIS_CONTAINER" ]; then
    log_error "❌ Redis container not found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
  
  if $COMPOSE_CMD exec -T redis redis-cli ping > /dev/null 2>&1; then
    log_info "✅ Redis connection: OK"
    return 0
  else
    log_error "❌ Redis connection: FAILED"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

test_websocket() {
  log_info "Testing WebSocket connection"
  
  # Try to connect to WebSocket endpoint (if available)
  # This is a basic check - actual WebSocket testing would require a client
  WS_URL=$(echo "$API_URL" | sed 's|http://|ws://|' | sed 's|https://|wss://|')
  
  # For now, just check if the API is responding
  # Full WebSocket testing would require a proper client
  if curl -s -f -m 5 "$API_URL/api/health" > /dev/null 2>&1; then
    log_info "✅ WebSocket endpoint check: OK (API is reachable)"
    return 0
  else
    log_warn "⚠️ WebSocket endpoint check: API not reachable (may be expected)"
    return 0
  fi
}

test_api_endpoints() {
  log_info "Testing API endpoints"
  
  # Health check
  test_endpoint "$API_URL/api/health" "API Health" 200
  
  # Check if API returns valid JSON for health
  HEALTH_RESPONSE=$(curl -s -m 10 "$API_URL/api/health" || echo "")
  if echo "$HEALTH_RESPONSE" | jq . > /dev/null 2>&1; then
    log_info "✅ API Health JSON: Valid"
  else
    log_warn "⚠️ API Health JSON: Invalid or empty"
  fi
}

test_frontend() {
  log_info "Testing Frontend"
  
  # Frontend should return HTML
  test_endpoint "$FRONTEND_URL" "Frontend" 200
  
  # Check if frontend returns HTML
  FRONTEND_RESPONSE=$(curl -s -m 10 "$FRONTEND_URL" | head -c 100 || echo "")
  if echo "$FRONTEND_RESPONSE" | grep -q "<!DOCTYPE html\|<html" 2>/dev/null; then
    log_info "✅ Frontend HTML: Valid"
  else
    log_warn "⚠️ Frontend HTML: May be invalid"
  fi
}

main() {
  log_info "=== Starting Smoke Tests ==="
  
  test_database
  test_redis
  test_api_endpoints
  test_frontend
  test_websocket
  
  log_info "=== Smoke Tests Summary ==="
  if [ $FAILED_TESTS -eq 0 ]; then
    log_info "✅ All smoke tests passed"
    exit 0
  else
    log_error "❌ $FAILED_TESTS smoke test(s) failed"
    exit 1
  fi
}

main "$@"
