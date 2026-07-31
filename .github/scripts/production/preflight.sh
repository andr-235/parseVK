#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

STORAGE_GUARD_SCRIPT="${STORAGE_GUARD_SCRIPT:-$SCRIPT_DIR/storage-guard.sh}"

require_env_file() {
  if [ ! -f "$(project_root)/.env" ]; then
    log_error "Production .env file not found at $(project_root)/.env"
    return 1
  fi
}

validate_compose() {
  if ! compose config >/dev/null 2>&1; then
    log_error "Invalid compose configuration: $COMPOSE_FILE"
    compose config || true
    return 1
  fi
}

check_storage_integrity() {
  [ -f "$STORAGE_GUARD_SCRIPT" ] || {
    log_error "Production storage guard not found: $STORAGE_GUARD_SCRIPT"
    return 1
  }
  bash "$STORAGE_GUARD_SCRIPT" check
}

check_external_networks() {
  local networks
  networks="$(compose config --format json | jq -r '.networks // {} | to_entries[] | select(.value.external == true) | .value.name // .key')"

  if [ -z "$networks" ]; then
    return 0
  fi

  while IFS= read -r network_name; do
    [ -z "$network_name" ] && continue
    if ! docker network inspect "$network_name" >/dev/null 2>&1; then
      log_error "Required external docker network not found: $network_name"
      return 1
    fi
  done <<<"$networks"
}

check_local_runtime_images() {
  local images image missing=false
  images="$(compose config --format json | jq -r '
    .services | to_entries[]
    | select((.value.build // null) == null and (.value.image // "") != "")
    | .value.image
  ' | sort -u)"

  while IFS= read -r image; do
    [ -z "$image" ] && continue
    if ! docker image inspect "$image" >/dev/null 2>&1; then
      log_error "Required runtime image is not available locally: $image"
      missing=true
    fi
  done <<<"$images"

  if [ "$missing" = "true" ]; then
    log_error "Seed missing runtime images on the self-hosted runner before deployment"
    return 1
  fi
}

main() {
  require_command docker
  require_command jq
  require_command python3

  if ! docker compose version >/dev/null 2>&1; then
    log_error "Docker Compose is not available"
    exit 1
  fi

  require_env_file
  require_project_file "$COMPOSE_FILE"
  validate_compose
  check_storage_integrity
  check_external_networks
  check_local_runtime_images

  log_info "Offline production preflight completed successfully"
}

main "$@"
