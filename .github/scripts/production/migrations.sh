#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

MIGRATION_SERVICES="identity tasks vk content moderation im"

ensure_migration_images() {
  for svc in $MIGRATION_SERVICES; do
    if ! docker image inspect "parsevk-${svc}-service:local" >/dev/null 2>&1; then
      log_info "Building ${svc}-migrate image"
      compose build "${svc}-migrate"
    fi
  done
}

run_single_migration() {
  local svc="$1"
  log_info "Running ${svc} migrations..."

  if compose run --rm --no-deps "${svc}-migrate"; then
    log_info "${svc} migrations completed"
    return 0
  fi

  log_error "${svc} migrations failed"
  print_compose_logs 100 "${svc}-migrate" "${svc}-db"
  return 1
}

run_migrations() {
  ensure_migration_images

  for svc in $MIGRATION_SERVICES; do
    run_single_migration "$svc" || return 1
  done

  log_info "All database migrations completed successfully"
}

run_migrations "$@"
