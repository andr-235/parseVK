#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

SERVICE_CATALOG_CLI="${SERVICE_CATALOG_CLI:-$PROJECT_ROOT/.github/scripts/service_catalog.py}"
declare -A PULLED_IMAGES=()

pull_image() {
  local image="$1"
  if [ -n "${PULLED_IMAGES[$image]:-}" ]; then
    return 0
  fi
  PULLED_IMAGES[$image]=1
  log_info "Pulling image: $image"
  retry_with_backoff 3 5 "timeout 300s docker pull $image"
}

resolve_services() {
  if [ "$#" -gt 0 ]; then
    printf '%s\n' "$@"
    return 0
  fi

  if [ ! -f "$SERVICE_CATALOG_CLI" ]; then
    log_error "Service catalog CLI not found: $SERVICE_CATALOG_CLI"
    return 1
  fi

  local targets
  targets="$(python3 "$SERVICE_CATALOG_CLI" --repo-root "$PROJECT_ROOT" changed --purpose deploy --all)"
  read -r -a target_array <<< "$targets"
  printf '%s\n' "${target_array[@]}"
  printf '%s\n' prometheus node-exporter grafana
}

contains_service() {
  local expected="$1"
  shift
  local service
  for service in "$@"; do
    if [ "$service" = "$expected" ]; then
      return 0
    fi
  done
  return 1
}

prepare_images() {
  local resolved
  if ! resolved="$(resolve_services "$@")"; then
    log_error "Failed to resolve image preparation targets"
    return 1
  fi
  if [ -z "$resolved" ]; then
    log_info "No image preparation targets resolved"
    return 0
  fi

  local -a services
  mapfile -t services <<< "$resolved"

  if contains_service frontend "${services[@]}"; then
    pull_image "oven/bun:1-alpine"
    pull_image "nginx:alpine"
  fi

  if contains_service prometheus "${services[@]}"; then
    pull_image "prom/prometheus:v3.11.3"
  fi
  if contains_service node-exporter "${services[@]}"; then
    pull_image "prom/node-exporter:v1.11.1"
  fi
  if contains_service grafana "${services[@]}"; then
    pull_image "grafana/grafana:13.0.1-security-01"
  fi

  local service
  for service in "${services[@]}"; do
    case "$service" in
      api-gateway|*-service)
        pull_image "python:3.12.13-slim"
        break
        ;;
    esac
  done
}

build_services() {
  if [ "$#" -eq 0 ]; then
    log_info "No local services requested for build"
    return 0
  fi

  log_info "Building local services: $*"
  retry_with_backoff 2 10 "timeout 1200s docker compose --progress plain -f \"$COMPOSE_FILE\" build $*"
}

case "${1:-}" in
  prepare)
    shift || true
    prepare_images "$@"
    ;;
  build)
    shift
    build_services "$@"
    ;;
  *)
    log_error "Usage: images.sh {prepare|build [services...]}"
    exit 1
    ;;
esac
