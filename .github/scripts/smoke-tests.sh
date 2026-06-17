#!/bin/bash
set -euo pipefail

if [ -f "$(dirname "$0")/log-helper.sh" ]; then
  source "$(dirname "$0")/log-helper.sh"
else
  log_info() { echo "[INFO] $1"; }
  log_error() { echo "[ERROR] $1" >&2; }
  log_warn() { echo "[WARN] $1"; }
fi

COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
COMPOSE_CMD="docker compose${COMPOSE_FILE:+ -f $COMPOSE_FILE}"
GATEWAY_URL=${GATEWAY_URL:-http://localhost:3002}
FRONTEND_URL=${FRONTEND_URL:-http://localhost:8080}
MAX_RETRIES=${MAX_RETRIES:-5}
RETRY_DELAY=${RETRY_DELAY:-3}

FAILED_TESTS=0

test_endpoint() {
  local url=$1 description=$2 expected=${3:-200}
  log_info "Testing $description: $url"
  local retry=0
  while [ $retry -lt $MAX_RETRIES ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$url" || echo "000")
    if [ "$HTTP_CODE" = "$expected" ]; then
      log_info "✅ $description: OK (HTTP $HTTP_CODE)"
      return 0
    fi
    retry=$((retry + 1))
    [ $retry -lt $MAX_RETRIES ] && log_warn "$description failed (HTTP $HTTP_CODE), retry $retry/$MAX_RETRIES..." && sleep $RETRY_DELAY
  done
  log_error "❌ $description: FAILED (HTTP $HTTP_CODE after $MAX_RETRIES attempts)"
  FAILED_TESTS=$((FAILED_TESTS + 1))
  return 1
}

test_container_health() {
  local svc=$1
  local container
  container=$($COMPOSE_CMD ps -q "$svc" 2>/dev/null || echo "")
  [ -z "$container" ] && { log_warn "⚠️ $svc: container not found"; return 0; }
  local health
  health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
  [ "$health" = "healthy" ] || [ "$health" = "none" ] && { log_info "✅ $svc: $health"; return 0; }
  log_warn "⚠️ $svc: $health"
  return 0
}

test_redis() {
  local container
  container=$($COMPOSE_CMD ps -q redis 2>/dev/null || echo "")
  [ -z "$container" ] && { log_warn "⚠️ Redis: not running"; return 0; }
  if $COMPOSE_CMD exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    log_info "✅ Redis: OK"; return 0
  fi
  log_error "❌ Redis: FAILED"; FAILED_TESTS=$((FAILED_TESTS + 1)); return 1
}

test_api_endpoints() {
  test_endpoint "$GATEWAY_URL/health" "Gateway Health" 200
  local resp; resp=$(curl -s -m 10 "$GATEWAY_URL/health" || echo "")
  echo "$resp" | jq . >/dev/null 2>&1 && log_info "✅ Gateway Health JSON: Valid" || log_warn "⚠️ Gateway Health JSON: Invalid"
}

test_frontend() {
  test_endpoint "$FRONTEND_URL" "Frontend" 200
  local resp; resp=$(curl -s -m 10 "$FRONTEND_URL" | head -c 100 || echo "")
  echo "$resp" | grep -q "<!DOCTYPE html\|<html" 2>/dev/null && log_info "✅ Frontend HTML: Valid" || log_warn "⚠️ Frontend HTML: May be invalid"
}

main() {
  log_info "=== Starting Smoke Tests ==="
  test_redis
  test_api_endpoints
  test_frontend
  for svc in api-gateway identity-service tasks-service vk-service content-service moderation-service telegram-service im-service frontend; do
    test_container_health "$svc"
  done
  log_info "=== Smoke Tests Summary ==="
  [ $FAILED_TESTS -eq 0 ] && log_info "✅ All smoke tests passed" && exit 0
  log_error "❌ $FAILED_TESTS smoke test(s) failed"; exit 1
}

main "$@"
