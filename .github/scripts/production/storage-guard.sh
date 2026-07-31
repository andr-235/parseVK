#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/storage-integrity.sh"

read_server_setting() {
  local key="$1" env_file="$(project_root)/.env"
  [ -f "$env_file" ] || return 0
  awk -F= -v key="$key" '
    $1 == key { value = substr($0, index($0, "=") + 1) }
    END { if (value != "") print value }
  ' "$env_file"
}

threshold() {
  local direct="$1" key="$2" fallback="$3" value
  value="$direct"
  [ -n "$value" ] || value="${!key:-}"
  [ -n "$value" ] || value="$(read_server_setting "$key")"
  printf '%s\n' "${value:-$fallback}"
}

validate_threshold() {
  local name="$1" value="$2"
  [[ "$value" =~ ^[0-9]+$ ]] || {
    log_error "$name must be a non-negative integer: $value"
    return 1
  }
}

available_kb() {
  df -Pk "$1" | awk 'NR == 2 {print $4}'
}

check_space() {
  local label="$1" path="$2" minimum_gb="$3" available required
  [ -d "$path" ] || { log_error "$label path does not exist: $path"; return 1; }
  available="$(available_kb "$path")"
  [[ "$available" =~ ^[0-9]+$ ]] || {
    log_error "Cannot determine free space for $label: $path"
    return 1
  }
  required=$((minimum_gb * 1024 * 1024))
  log_info "$label free space: $((available / 1024 / 1024)) GiB; required: ${minimum_gb} GiB"
  (( available >= required )) || {
    log_error "$label has insufficient free space: $path"
    return 1
  }
}

require_integrity_commands() {
  require_command docker
  require_command jq
  require_command python3
}

check_deploy_integrity() {
  require_integrity_commands
  require_command df
  require_command awk
  local project_gb docker_gb docker_root
  project_gb="$(threshold "${MIN_FREE_PROJECT_GB:-}" PRODUCTION_MIN_FREE_PROJECT_GB 10)"
  docker_gb="$(threshold "${MIN_FREE_DOCKER_GB:-}" PRODUCTION_MIN_FREE_DOCKER_GB 15)"
  validate_threshold PRODUCTION_MIN_FREE_PROJECT_GB "$project_gb"
  validate_threshold PRODUCTION_MIN_FREE_DOCKER_GB "$docker_gb"
  docker_root="$(docker info --format '{{.DockerRootDir}}')"
  check_space "Project filesystem" "$(project_root)" "$project_gb"
  check_space "Docker filesystem" "$docker_root" "$docker_gb"
  validate_metadata
  verify_metadata_releases
  log_info "Production storage and rollback integrity check passed"
}

check_rollback_integrity() {
  require_integrity_commands
  local commit
  commit="${ROLLBACK_TARGET_COMMIT:-$(git -C "$(project_root)" rev-parse HEAD)}"
  validate_metadata
  verify_release "$commit"
  log_info "Rollback release integrity check passed: $commit"
}

case "${1:-}" in
  check) check_deploy_integrity ;;
  rollback) check_rollback_integrity ;;
  *) log_error "Usage: storage-guard.sh check|rollback"; exit 2 ;;
esac
