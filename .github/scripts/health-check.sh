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

MAX_ATTEMPTS=${MAX_ATTEMPTS:-30}
ATTEMPT=0
ALL_HEALTHY=false

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
if [ -n "$TARGET_SERVICES" ]; then
  echo "Target services: $TARGET_SERVICES"
fi

echo "=== Waiting for services to be healthy ==="

if ! command -v docker > /dev/null 2>&1 || ! docker compose version > /dev/null 2>&1; then
  echo "Error: Docker or docker compose not available"
  exit 1
fi

if [ -n "$TARGET_SERVICES" ]; then
  if $COMPOSE_CMD wait --timeout 120 $TARGET_SERVICES 2>/dev/null; then
    echo "All services with healthchecks are healthy (via docker compose wait)"
    exit 0
  fi
else
  if $COMPOSE_CMD wait --timeout 120 2>/dev/null; then
    echo "All services with healthchecks are healthy (via docker compose wait)"
    exit 0
  fi
fi

echo "Warning: docker compose wait failed or timed out, falling back to manual check"

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))
  echo "Attempt $ATTEMPT/$MAX_ATTEMPTS"
  
  UNHEALTHY_COUNT=0
  TOTAL_COUNT=0
  
  if [ -n "$TARGET_SERVICES" ]; then
    CONTAINERS=$($COMPOSE_CMD ps -q $TARGET_SERVICES)
  else
    CONTAINERS=$($COMPOSE_CMD ps -q)
  fi

  for container in $CONTAINERS; do
    if [ -z "$container" ]; then
      continue
    fi
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
    HAS_HEALTHCHECK=$(docker inspect --format='{{.Config.Healthcheck}}' "$container" 2>/dev/null | grep -q "Test" && echo "yes" || echo "no")
    NAME=$(docker inspect --format='{{.Name}}' "$container" 2>/dev/null | sed 's/^\///')
    
    if [ "$STATUS" != "running" ]; then
      echo "  $NAME: $STATUS (waiting...)"
      UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
    elif [ "$HAS_HEALTHCHECK" = "yes" ]; then
      if [ "$HEALTH" = "healthy" ]; then
        echo "  $NAME: running (healthy)"
      else
        echo "  $NAME: running ($HEALTH - waiting...)"
        UNHEALTHY_COUNT=$((UNHEALTHY_COUNT + 1))
      fi
    else
      echo "  $NAME: running (no healthcheck)"
    fi
  done
  
  if [ $UNHEALTHY_COUNT -eq 0 ] && [ $TOTAL_COUNT -gt 0 ]; then
    ALL_HEALTHY=true
    break
  fi
  
  sleep 2
done

if [ "$ALL_HEALTHY" != "true" ]; then
  echo "Error: Not all containers are healthy"
  echo "=== Container status ==="
  if [ -n "$TARGET_SERVICES" ]; then
    $COMPOSE_CMD ps $TARGET_SERVICES
  else
    $COMPOSE_CMD ps
  fi
  echo "=== Failed container logs ==="
  if [ -n "$TARGET_SERVICES" ]; then
    CONTAINERS=$($COMPOSE_CMD ps -q $TARGET_SERVICES)
  else
    CONTAINERS=$($COMPOSE_CMD ps -q)
  fi
  for container in $CONTAINERS; do
    STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
    NAME=$(docker inspect --format='{{.Name}}' "$container" 2>/dev/null | sed 's/^\///')
    if [ "$STATUS" != "running" ] || ([ "$HEALTH" != "healthy" ] && [ "$HEALTH" != "none" ]); then
      echo "=== Logs for $NAME ==="
      $COMPOSE_CMD logs --tail=100 "$(echo $NAME | sed 's/^parsevk-//' | sed 's/-[0-9]*$//')" || docker logs "$container" --tail=100 || true
    fi
  done
  exit 1
fi

echo "All containers are healthy"
