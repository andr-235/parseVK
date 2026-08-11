#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../log-helper.sh" ]; then
  # shellcheck source=/dev/null
  source "$SCRIPT_DIR/../log-helper.sh"
fi

PROJECT_ROOT="${PROJECT_ROOT:-/opt/parseVK}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE_OVERRIDE_FILE="${COMPOSE_OVERRIDE_FILE:-}"
if [ -z "$COMPOSE_OVERRIDE_FILE" ] && [ "$PROJECT_ROOT" = "/opt/parseVK" ]; then
  if [ -f "/etc/parsevk/vk-secret.override.yml" ]; then
    COMPOSE_OVERRIDE_FILE="/etc/parsevk/vk-secret.override.yml"
  elif [ -n "${GITHUB_WORKSPACE:-}" ] && [ -f "$GITHUB_WORKSPACE/docker-compose.production.yml" ]; then
    COMPOSE_OVERRIDE_FILE="$GITHUB_WORKSPACE/docker-compose.production.yml"
  else
    COMPOSE_OVERRIDE_FILE="/etc/parsevk/vk-secret.override.yml"
  fi
fi

project_root() {
  printf '%s\n' "$PROJECT_ROOT"
}

project_file_path() {
  local file_path="$1"
  if [[ "$file_path" = /* ]]; then
    printf '%s\n' "$file_path"
  else
    printf '%s/%s\n' "$(project_root)" "$file_path"
  fi
}

compose_file_path() {
  project_file_path "$COMPOSE_FILE"
}

with_project_root() {
  (
    cd "$(project_root)"
    "$@"
  )
}

compose() {
  local compose_cmd=(docker compose -f "$COMPOSE_FILE")
  if [ -n "$COMPOSE_OVERRIDE_FILE" ]; then
    compose_cmd+=(-f "$COMPOSE_OVERRIDE_FILE")
  fi
  with_project_root "${compose_cmd[@]}" "$@"
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    log_error "Required command not found: $command_name"
    return 1
  fi
}

require_project_file() {
  local file_path="$1" resolved
  resolved="$(project_file_path "$file_path")"
  if [ ! -f "$resolved" ]; then
    log_error "Required file not found: $resolved"
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

