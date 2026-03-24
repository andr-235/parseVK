#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

API_IMAGE_TAG="${API_IMAGE_TAG:-parsevk-api:local}"

ensure_api_image() {
  if docker image inspect "$API_IMAGE_TAG" >/dev/null 2>&1; then
    return 0
  fi

  log_info "API image is missing, building it before migrations"
  "$SCRIPT_DIR/images.sh" build api
}

run_migrations() {
  ensure_api_image

  if compose run --rm --no-deps api-migrate; then
    log_info "Migrations completed"
    return 0
  fi

  log_error "Database migrations failed"
  print_compose_logs 100 api-migrate api db
  return 1
}

run_migrations "$@"
