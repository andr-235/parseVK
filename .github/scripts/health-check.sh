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
PROJECT_ROOT=${PROJECT_ROOT:-$(pwd)}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.yml}
COMPOSE_OVERRIDE_FILE=${COMPOSE_OVERRIDE_FILE:-}
if [ -z "$COMPOSE_OVERRIDE_FILE" ] && [ "$PROJECT_ROOT" = "/opt/parseVK" ]; then
  if [ -f "/etc/parsevk/vk-secret.override.yml" ]; then
    COMPOSE_OVERRIDE_FILE="/etc/parsevk/vk-secret.override.yml"
  elif [ -n "${GITHUB_WORKSPACE:-}" ] && [ -f "$GITHUB_WORKSPACE/docker-compose.production.yml" ]; then
    COMPOSE_OVERRIDE_FILE="$GITHUB_WORKSPACE/docker-compose.production.yml"
  else
    COMPOSE_OVERRIDE_FILE="/etc/parsevk/vk-secret.override.yml"
  fi
fi
SMOKE_REPORT=${SMOKE_REPORT:-/tmp/parsevk-post-deploy-smoke.json}
COMPOSE_CMD=(docker compose -f "$COMPOSE_FILE")
if [ -n "$COMPOSE_OVERRIDE_FILE" ]; then
  COMPOSE_CMD+=(-f "$COMPOSE_OVERRIDE_FILE")
fi

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

verify_vk_runtime() {
  log_info "Verifying VK runtime readiness"
  "${COMPOSE_CMD[@]}" exec -T vk-service python - <<'PY'
import json
import urllib.request

with urllib.request.urlopen("http://localhost:8000/health", timeout=5) as response:
    data = json.load(response)

print(json.dumps(data, ensure_ascii=False))

expected = {
    "status": "UP",
    "vkTokenConfigured": "yes",
    "vkAccountStatus": "active",
    "kafkaConsumer": "healthy",
    "ingestionAckConsumer": "healthy",
    "outboxPublisher": "healthy",
    "stagedPartPublisher": "healthy",
    "executionWorker": "healthy",
}

failed = {
    key: {"expected": value, "actual": data.get(key)}
    for key, value in expected.items()
    if data.get(key) != value
}

if failed:
    print(json.dumps({"vk_runtime_failures": failed}, ensure_ascii=False))
    raise SystemExit(1)
PY
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

if [ -n "$COMPOSE_OVERRIDE_FILE" ]; then
  verify_vk_runtime
fi

if [ "$FULL_DEPLOY" = "true" ]; then
  SMOKE_SCRIPT="$(dirname "$0")/production/post_deploy_smoke.py"
  if [ ! -f "$SMOKE_SCRIPT" ]; then
    log_error "Production smoke script not found: $SMOKE_SCRIPT"
    exit 1
  fi
  log_info "Verifying production HTTP entrypoints"
  python3 "$SMOKE_SCRIPT" --report "$SMOKE_REPORT"
fi
