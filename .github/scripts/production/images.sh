#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

pull_image() {
  local image="$1"
  log_info "Pulling image: $image"
  retry_with_backoff 3 5 "timeout 300s docker pull $image"
}

should_include_service() {
  local service_name="$1"
  shift || true

  if [ "$#" -eq 0 ]; then
    return 0
  fi

  local requested
  for requested in "$@"; do
    if [ "$requested" = "$service_name" ]; then
      return 0
    fi
  done

  return 1
}

pull_runtime_images_for_services() {
  if should_include_service api "$@"; then
    pull_image "postgres:15-alpine"
    pull_image "redis:7-alpine"
  fi

  if should_include_service frontend "$@"; then
    pull_image "nginx:alpine"
  fi

  if should_include_service db_backup "$@"; then
    pull_image "postgres:15-alpine"
  fi

  if should_include_service prometheus "$@"; then
    pull_image "prom/prometheus:latest"
  fi

  if should_include_service node-exporter "$@"; then
    pull_image "prom/node-exporter:latest"
  fi

  if should_include_service grafana "$@"; then
    pull_image "grafana/grafana:latest"
  fi
}

pull_build_base_images_for_services() {
  if should_include_service api "$@"; then
    pull_image "oven/bun:1"
  fi

  if should_include_service frontend "$@"; then
    pull_image "oven/bun:1-alpine"
    pull_image "nginx:alpine"
  fi

  if should_include_service db_backup "$@"; then
    pull_image "postgres:15-alpine"
  fi
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
    pull_runtime_images_for_services "$@"
    pull_build_base_images_for_services "$@"
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
