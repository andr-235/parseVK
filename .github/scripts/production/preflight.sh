#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

check_registry_reachability() {
  local url="$1"
  local host_label="$2"
  if ! curl -I -sS --max-time 15 "$url" >/dev/null; then
    log_error "Registry endpoint is unreachable: $host_label ($url)"
    return 1
  fi
}

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

main() {
  require_command docker
  require_command jq
  require_command curl

  if ! docker compose version >/dev/null 2>&1; then
    log_error "Docker Compose is not available"
    exit 1
  fi

  require_env_file
  require_project_file "$COMPOSE_FILE"
  validate_compose
  check_external_networks

  check_registry_reachability "https://registry-1.docker.io/v2/" "Docker Hub"
  check_registry_reachability "https://ghcr.io/v2/" "GHCR"

  log_info "Production preflight completed successfully"
}

main "$@"

