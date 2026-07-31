#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

UP_ARGS="${UP_ARGS:--d}"
PULL_POLICY="${PULL_POLICY:-never}"
RELEASE_MODE="${RELEASE_MODE:-auto}"
RELEASES_DIR="${RELEASES_DIR:-$(project_root)/.releases}"
RUNTIME_HEALTH_CHECK="${RUNTIME_HEALTH_CHECK:-auto}"
SERVICES=("$@")

resolve_release_mode() {
  local commit manifest status

  case "$RELEASE_MODE" in
    full|runtime)
      printf '%s\n' "$RELEASE_MODE"
      return 0
      ;;
    auto)
      ;;
    *)
      log_error "Unsupported release mode: $RELEASE_MODE"
      return 1
      ;;
  esac

  commit="$(with_project_root git rev-parse HEAD 2>/dev/null || true)"
  manifest="$RELEASES_DIR/$commit/release.json"
  status=""
  if [ -n "$commit" ] && [ -f "$manifest" ]; then
    status="$(jq -r '.status // empty' "$manifest" 2>/dev/null || true)"
  fi

  if [ "$status" = "successful" ]; then
    printf 'runtime\n'
  else
    printf 'full\n'
  fi
}

resolve_runtime_services() {
  require_command jq
  compose config --format json \
    | jq -r '
        .services
        | to_entries[]
        | select((.value.restart // "") != "no")
        | .key
      '
}

runtime_health_check_enabled() {
  case "$RUNTIME_HEALTH_CHECK" in
    true)
      return 0
      ;;
    false)
      return 1
      ;;
    auto)
      ;;
    *)
      log_error "Unsupported runtime health-check mode: $RUNTIME_HEALTH_CHECK"
      return 2
      ;;
  esac

  if [ -n "${GITHUB_EVENT_PATH:-}" ] && [ -f "$GITHUB_EVENT_PATH" ]; then
    if jq -e '((.inputs.skip_health_check // false) | tostring) == "true"' \
      "$GITHUB_EVENT_PATH" >/dev/null 2>&1; then
      return 1
    fi
  fi

  return 0
}

verify_runtime_release() {
  local health_script="$SCRIPT_DIR/../health-check.sh"

  if ! runtime_health_check_enabled; then
    log_warn "Runtime health check was explicitly skipped"
    return 0
  fi

  [ -f "$health_script" ] || {
    log_error "Current runtime health-check script is missing: $health_script"
    return 1
  }

  log_info "Verifying runtime services with current deployment health-check logic"
  COMPOSE_FILE="$COMPOSE_FILE" FULL_DEPLOY="true" \
    bash "$health_script"
}

start_full_release() {
  if [ "${#SERVICES[@]}" -gt 0 ]; then
    compose up --pull "$PULL_POLICY" --remove-orphans ${UP_ARGS} "${SERVICES[@]}"
  else
    compose up --pull "$PULL_POLICY" --remove-orphans ${UP_ARGS}
  fi
}

start_runtime_release() {
  local -a targets

  if [ "${#SERVICES[@]}" -gt 0 ]; then
    targets=("${SERVICES[@]}")
  else
    mapfile -t targets < <(resolve_runtime_services)
  fi

  [ "${#targets[@]}" -gt 0 ] || {
    log_error "No runtime services resolved"
    return 1
  }

  log_info "Starting runtime services without migration or init dependencies"
  compose up --pull "$PULL_POLICY" --remove-orphans --no-deps ${UP_ARGS} "${targets[@]}"
}

start_services() {
  local mode
  mode="$(resolve_release_mode)"
  log_info "Release mode: $mode"

  if [ "$mode" = "runtime" ]; then
    if start_runtime_release && verify_runtime_release; then
      log_info "Runtime containers started and verified successfully"
      print_compose_status
      return 0
    fi
  elif start_full_release; then
    log_info "Containers started successfully"
    print_compose_status
    return 0
  fi

  log_error "Failed to start containers"
  print_compose_status
  print_compose_logs 50
  return 1
}

start_services
