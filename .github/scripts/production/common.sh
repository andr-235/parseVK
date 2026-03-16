#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../log-helper.sh" ]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/../log-helper.sh"
fi

PROJECT_ROOT="${PROJECT_ROOT:-/opt/parseVK}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.deploy.yml}"

project_root() {
  printf '%s\n' "$PROJECT_ROOT"
}

compose_file_path() {
  printf '%s/%s\n' "$(project_root)" "$COMPOSE_FILE"
}

with_project_root() {
  (
    cd "$(project_root)"
    "$@"
  )
}

compose() {
  with_project_root docker compose -f "$COMPOSE_FILE" "$@"
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    log_error "Required command not found: $command_name"
    return 1
  fi
}

require_project_file() {
  local file_path="$1"
  if [ ! -f "$(project_root)/$file_path" ]; then
    log_error "Required file not found: $(project_root)/$file_path"
    return 1
  fi
}

set_output() {
  local key="$1"
  local value="$2"
  if [ -n "${GITHUB_OUTPUT:-}" ]; then
    printf '%s=%s\n' "$key" "$value" >>"$GITHUB_OUTPUT"
  else
    printf '%s=%s\n' "$key" "$value"
  fi
}

print_compose_status() {
  log_info "Container status"
  compose ps || true
}

print_compose_logs() {
  local tail_lines="${1:-50}"
  shift || true
  log_warn "Recent container logs"
  if [ "$#" -gt 0 ]; then
    compose logs --tail="$tail_lines" "$@" || true
  else
    compose logs --tail="$tail_lines" || true
  fi
}

