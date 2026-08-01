#!/bin/bash
set -euo pipefail

if [ -f "$(dirname "$0")/log-helper.sh" ]; then
  # shellcheck source=/dev/null
  source "$(dirname "$0")/log-helper.sh"
else
  log_info() { echo "[INFO] $1"; }
  log_error() { echo "[ERROR] $1" >&2; }
  log_warn() { echo "[WARN] $1"; }
fi

MAX_ATTEMPTS=${MAX_ATTEMPTS:-30}
TARGET_SERVICES=${TARGET_SERVICES:-}
FULL_DEPLOY=${FULL_DEPLOY:-false}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
SMOKE_REPORT=${SMOKE_REPORT:-/tmp/parsevk-post-deploy-smoke.json}
COMPOSE_CMD=(docker compose -f "$COMPOSE_FILE")

if [ "$FULL_DEPLOY" = "true" ]; then
  TARGET_SERVICES=""
fi

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  log_error "Docker or docker compose not available"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  log_error "jq is required for health checks"
  exit 1
fi

resolve_services() {
  if [ -n "$TARGET_SERVICES" ]; then
    tr ' ' '\n' <<<"$TARGET_SERVICES" | sed '/^$/d'
    return 0
  fi

  "${COMPOSE_CMD[@]}" config --format json \
    | jq -r '
        .services
        | to_entries[]
        | select((.value.restart // "") != "no")
        | .key
      '
}

mapfile -t SERVICES < <(resolve_services)
[ "${#SERVICES[@]}" -gt 0 ] || {
  log_error "No runtime services resolved for health check"
  exit 1
}

echo "=== Waiting for runtime services to be healthy ==="
echo "Services: ${SERVICES[*]}"

ALL_HEALTHY=false
for ((attempt=1; attempt<=MAX_ATTEMPTS; attempt++)); do
  echo "Attempt $attempt/$MAX_ATTEMPTS"
  UNHEALTHY_COUNT=0

  for service in "${SERVICES[@]}"; do
    container="$("${COMPOSE_CMD[@]}" ps -aq "$service" | head -n1)"
    if [ -z "$container" ]; then
      echo "  $service: missing"
      UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
      continue
    fi

    status="$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo unknown)"
    health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null || echo unknown)"
    has_healthcheck="$(docker inspect --format='{{if .Config.Healthcheck}}yes{{else}}no{{end}}' "$container" 2>/dev/null || echo no)"

    if [ "$status" != "running" ]; then
      echo "  $service: $status"
      UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
    elif [ "$has_healthcheck" = "yes" ] && [ "$health" != "healthy" ]; then
      echo "  $service: running ($health)"
      UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
    elif [ "$has_healthcheck" = "yes" ]; then
      echo "  $service: running (healthy)"
    else
      echo "  $service: running (no healthcheck)"
    fi
  done

  if [ "$UNHEALTHY_COUNT" -eq 0 ]; then
    ALL_HEALTHY=true
    break
  fi

  sleep 2
done

if [ "$ALL_HEALTHY" != "true" ]; then
  log_error "Not all runtime containers are healthy"
  echo "=== Container status ==="
  "${COMPOSE_CMD[@]}" ps -a "${SERVICES[@]}" || true
  echo "=== Failed container logs ==="

  for service in "${SERVICES[@]}"; do
    container="$("${COMPOSE_CMD[@]}" ps -aq "$service" | head -n1)"
    if [ -z "$container" ]; then
      echo "=== $service is missing ==="
      continue
    fi

    status="$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo unknown)"
    health="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$container" 2>/dev/null || echo unknown)"
    if [ "$status" != "running" ] || { [ "$health" != "healthy" ] && [ "$health" != "none" ]; }; then
      echo "=== Logs for $service ==="
      "${COMPOSE_CMD[@]}" logs --tail=100 "$service" || docker logs --tail=100 "$container" || true
    fi
  done
  exit 1
fi

log_info "All runtime containers are healthy"

if [ "$FULL_DEPLOY" = "true" ]; then
  SMOKE_SCRIPT="$(dirname "$0")/production/post_deploy_smoke.py"
  if [ ! -f "$SMOKE_SCRIPT" ]; then
    log_error "Production smoke script not found: $SMOKE_SCRIPT"
    exit 1
  fi
  log_info "Verifying production HTTP entrypoints"
  python3 "$SMOKE_SCRIPT" --report "$SMOKE_REPORT"
fi
