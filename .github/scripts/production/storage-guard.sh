#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

METADATA_FILE="${DEPLOYMENT_METADATA_FILE:-$(project_root)/.deployment-metadata.json}"
LOCAL_RELEASE_SCRIPT="${LOCAL_RELEASE_SCRIPT:-$SCRIPT_DIR/local-release.sh}"
MIN_FREE_PROJECT_GB="${MIN_FREE_PROJECT_GB:-10}"
MIN_FREE_DOCKER_GB="${MIN_FREE_DOCKER_GB:-15}"

validate_threshold() {
  local name="$1" value="$2"
  [[ "$value" =~ ^[0-9]+$ ]] || {
    log_error "$name must be a non-negative integer: $value"
    return 1
  }
}

available_kb() {
  local path="$1"
  df -Pk "$path" | awk 'NR == 2 {print $4}'
}

check_space() {
  local label="$1" path="$2" minimum_gb="$3"
  local available required
  [ -d "$path" ] || {
    log_error "$label path does not exist: $path"
    return 1
  }
  available="$(available_kb "$path")"
  [[ "$available" =~ ^[0-9]+$ ]] || {
    log_error "Cannot determine free space for $label: $path"
    return 1
  }
  required=$((minimum_gb * 1024 * 1024))
  log_info "$label free space: $((available / 1024 / 1024)) GiB; required: ${minimum_gb} GiB"
  if (( available < required )); then
    log_error "$label has insufficient free space: $path"
    return 1
  fi
}

metadata_commit() {
  local key="$1"
  jq -r ".${key} // empty" "$METADATA_FILE"
}

validate_metadata() {
  [ -f "$METADATA_FILE" ] || {
    log_info "Deployment metadata is absent; first local release is allowed"
    return 0
  }
  jq -e '
    type == "object"
    and ((.last_successful_commit // "") | type == "string")
    and ((.previous_successful_commit // "") | type == "string")
    and ((.last_successful_commit // "") | test("^$|^[0-9a-f]{7,40}$"))
    and ((.previous_successful_commit // "") | test("^$|^[0-9a-f]{7,40}$"))
  ' "$METADATA_FILE" >/dev/null || {
    log_error "Deployment metadata is invalid: $METADATA_FILE"
    return 1
  }
}

verify_release_set() {
  [ -f "$METADATA_FILE" ] || return 0
  local current previous commit verified_commit=""
  current="$(metadata_commit last_successful_commit)"
  previous="$(metadata_commit previous_successful_commit)"
  for commit in "$current" "$previous"; do
    [ -n "$commit" ] || continue
    [ "$commit" != "$verified_commit" ] || continue
    PROJECT_ROOT="$(project_root)" \
      DEPLOYMENT_METADATA_FILE="$METADATA_FILE" \
      bash "$LOCAL_RELEASE_SCRIPT" verify "$commit"
    verified_commit="$commit"
  done
}

main() {
  require_command docker
  require_command jq
  require_command df
  require_command awk
  validate_threshold MIN_FREE_PROJECT_GB "$MIN_FREE_PROJECT_GB"
  validate_threshold MIN_FREE_DOCKER_GB "$MIN_FREE_DOCKER_GB"

  local docker_root
  docker_root="$(docker info --format '{{.DockerRootDir}}')"
  check_space "Project filesystem" "$(project_root)" "$MIN_FREE_PROJECT_GB"
  check_space "Docker filesystem" "$docker_root" "$MIN_FREE_DOCKER_GB"
  validate_metadata
  verify_release_set
  log_info "Production storage and rollback integrity check passed"
}

case "${1:-}" in
  check) main ;;
  *) log_error "Usage: storage-guard.sh check"; exit 2 ;;
esac
