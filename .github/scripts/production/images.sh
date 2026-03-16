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

pull_external_images() {
  pull_image "oven/bun:1"
  pull_image "oven/bun:1-alpine"
  pull_image "nginx:alpine"
  pull_image "postgres:15-alpine"
  pull_image "redis:7-alpine"
  pull_image "prom/prometheus:latest"
  pull_image "prom/node-exporter:latest"
  pull_image "grafana/grafana:latest"
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
    pull_external_images
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

