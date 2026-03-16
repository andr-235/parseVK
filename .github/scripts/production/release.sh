#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

UP_ARGS="${UP_ARGS:--d}"
SERVICES=("$@")

start_services() {
  if [ "${#SERVICES[@]}" -gt 0 ]; then
    if compose up ${UP_ARGS} "${SERVICES[@]}"; then
      log_info "Containers started successfully"
      print_compose_status
      return 0
    fi
  elif compose up ${UP_ARGS}; then
    log_info "Containers started successfully"
    print_compose_status
    return 0
  fi

  log_error "Failed to start containers"
  print_compose_status
  print_compose_logs 50
  return 1
}

start_services "$@"
