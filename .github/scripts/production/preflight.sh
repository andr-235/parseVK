#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

STORAGE_GUARD_SCRIPT="${STORAGE_GUARD_SCRIPT:-$SCRIPT_DIR/storage-guard.sh}"
VK_PRODUCTION_SECRET_PATH="${VK_PRODUCTION_SECRET_PATH:-/etc/parsevk/secrets/vk_token}"

stage_deploy_tools() {
  if [ -z "${RUNNER_TEMP:-}" ] || [ -z "${GITHUB_ENV:-}" ]; then
    return 0
  fi

  local source_root stage_root
  if [ -n "${GITHUB_WORKSPACE:-}" ] && [ -d "$GITHUB_WORKSPACE/.github/scripts" ]; then
    source_root="$GITHUB_WORKSPACE/.github/scripts"
  else
    source_root="$(project_root)/.github/scripts"
  fi
  stage_root="$RUNNER_TEMP/parsevk-deploy-tools-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}"

  [ -d "$source_root" ] || {
    log_error "Validated deploy scripts not found: $source_root"
    return 1
  }

  rm -rf "$stage_root"
  mkdir -p "$stage_root"
  cp -a "$source_root/." "$stage_root/"

  PRODUCTION_SCRIPTS_DIR="$stage_root/production"
  SERVICE_CATALOG_CLI="$stage_root/service_catalog.py"
  LOCAL_RELEASE_SCRIPT="$stage_root/production/local-release.sh"
  STORAGE_GUARD_SCRIPT="$stage_root/production/storage-guard.sh"
  HEALTH_CHECK_SCRIPT="$stage_root/health-check.sh"
  HTTP_HEALTH_CHECK_SCRIPT="$stage_root/http-health-check.sh"
  export PRODUCTION_SCRIPTS_DIR SERVICE_CATALOG_CLI LOCAL_RELEASE_SCRIPT STORAGE_GUARD_SCRIPT
  export HEALTH_CHECK_SCRIPT HTTP_HEALTH_CHECK_SCRIPT COMPOSE_OVERRIDE_FILE

  {
    printf 'PRODUCTION_SCRIPTS_DIR=%s\n' "$PRODUCTION_SCRIPTS_DIR"
    printf 'SERVICE_CATALOG_CLI=%s\n' "$SERVICE_CATALOG_CLI"
    printf 'LOCAL_RELEASE_SCRIPT=%s\n' "$LOCAL_RELEASE_SCRIPT"
    printf 'STORAGE_GUARD_SCRIPT=%s\n' "$STORAGE_GUARD_SCRIPT"
    printf 'HEALTH_CHECK_SCRIPT=%s\n' "$HEALTH_CHECK_SCRIPT"
    printf 'HTTP_HEALTH_CHECK_SCRIPT=%s\n' "$HTTP_HEALTH_CHECK_SCRIPT"
    printf 'COMPOSE_OVERRIDE_FILE=%s\n' "$COMPOSE_OVERRIDE_FILE"
  } >> "$GITHUB_ENV"

  log_info "Deploy tools staged outside shared workspace: $stage_root"
}

require_env_file() {
  if [ ! -f "$(project_root)/.env" ]; then
    log_error "Production .env file not found at $(project_root)/.env"
    return 1
  fi
}

require_production_compose_overlay() {
  if [ "$PROJECT_ROOT" != "/opt/parseVK" ]; then
    return 0
  fi
  if [ -z "$COMPOSE_OVERRIDE_FILE" ]; then
    log_error "Production compose override is not configured"
    return 1
  fi
  require_host_file "$COMPOSE_OVERRIDE_FILE"
}

require_vk_secret() {
  if [ "$PROJECT_ROOT" != "/opt/parseVK" ]; then
    return 0
  fi
  if [ ! -f "$VK_PRODUCTION_SECRET_PATH" ] || [ ! -s "$VK_PRODUCTION_SECRET_PATH" ]; then
    log_error "Required VK production secret is missing or empty: $VK_PRODUCTION_SECRET_PATH"
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

integrity_mode() {
  if [ -n "${PREFLIGHT_MODE:-}" ]; then
    printf '%s\n' "$PREFLIGHT_MODE"
  elif [ "${GITHUB_WORKFLOW:-}" = "Rollback Deployment" ]; then
    printf 'rollback\n'
  else
    printf 'check\n'
  fi
}

check_storage_integrity() {
  [ -f "$STORAGE_GUARD_SCRIPT" ] || {
    log_error "Production storage guard not found: $STORAGE_GUARD_SCRIPT"
    return 1
  }
  bash "$STORAGE_GUARD_SCRIPT" "$(integrity_mode)"
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
  require_production_compose_overlay
  require_vk_secret
  validate_compose
  stage_deploy_tools
  check_storage_integrity
  check_external_networks
  check_local_runtime_images

  log_info "Offline production preflight completed successfully"
}

main "$@"
