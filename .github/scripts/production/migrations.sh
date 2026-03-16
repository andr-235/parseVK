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

  if compose run --rm --no-deps --entrypoint sh api -c "command -v ./node_modules/.bin/prisma > /dev/null 2>&1 && ./node_modules/.bin/prisma migrate deploy || prisma migrate deploy"; then
    log_info "Migrations completed"
    return 0
  fi

  log_error "Database migrations failed"
  print_compose_logs 100 api db
  return 1
}

run_migrations "$@"

