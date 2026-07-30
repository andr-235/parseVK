#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

SERVICE_CATALOG_CLI="${SERVICE_CATALOG_CLI:-$PROJECT_ROOT/.github/scripts/service_catalog.py}"
RELEASES_DIR="${RELEASES_DIR:-$(project_root)/.releases}"
RELEASE_IMAGE_NAMESPACE="${RELEASE_IMAGE_NAMESPACE:-parsevk-release}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-parsevk}"
RELEASE_RETENTION="${RELEASE_RETENTION:-3}"

validate_commit() {
  [[ "$1" =~ ^[0-9a-f]{7,40}$ ]] || {
    log_error "Invalid release commit: $1"
    return 1
  }
}

manifest_path() {
  printf '%s/%s/release.json\n' "$RELEASES_DIR" "$1"
}

resolve_targets() {
  require_project_file ".github/scripts/service_catalog.py"
  python3 "$SERVICE_CATALOG_CLI" --repo-root "$PROJECT_ROOT" changed --purpose deploy --all
}

active_ref() {
  printf '%s-%s:latest\n' "$COMPOSE_PROJECT_NAME" "$1"
}

release_ref() {
  printf '%s/%s:sha-%s\n' "$RELEASE_IMAGE_NAMESPACE" "$1" "$2"
}

snapshot_release() {
  local commit="$1" manifest tmp target active release image_id resolved
  validate_commit "$commit"
  resolved="$(resolve_targets)"
  read -r -a targets <<<"$resolved"
  [ "${#targets[@]}" -gt 0 ] || { log_error "No release targets resolved"; return 1; }

  manifest="$(manifest_path "$commit")"
  mkdir -p "$(dirname "$manifest")"
  tmp="${manifest}.tmp"
  jq -n --arg commit "$commit" --arg created_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{schema_version:1, commit_sha:$commit, status:"candidate", created_at:$created_at, images:{}}' >"$tmp"

  for target in "${targets[@]}"; do
    active="$(active_ref "$target")"
    release="$(release_ref "$target" "$commit")"
    image_id="$(docker image inspect "$active" --format '{{.Id}}' 2>/dev/null)" || {
      rm -f "$tmp"
      log_error "Active image is missing for $target: $active"
      return 1
    }
    docker tag "$active" "$release"
    jq --arg target "$target" --arg active "$active" --arg release "$release" --arg image_id "$image_id" \
      '.images[$target] = {active_ref:$active, release_ref:$release, image_id:$image_id}' \
      "$tmp" >"${tmp}.next"
    mv "${tmp}.next" "$tmp"
  done

  mv "$tmp" "$manifest"
  log_info "Created local release candidate: $manifest"
}

verify_release() {
  local commit="$1" manifest status release expected actual
  validate_commit "$commit"
  manifest="$(manifest_path "$commit")"
  [ -f "$manifest" ] || { log_error "Release manifest not found: $manifest"; return 1; }
  status="$(jq -r '.status // empty' "$manifest")"
  [ "$status" = "successful" ] || { log_error "Release is not successful: $commit ($status)"; return 1; }

  while IFS=$'\t' read -r release expected; do
    actual="$(docker image inspect "$release" --format '{{.Id}}' 2>/dev/null)" || {
      log_error "Local release image is missing: $release"
      return 1
    }
    [ "$actual" = "$expected" ] || {
      log_error "Local release image mismatch: $release"
      return 1
    }
  done < <(jq -r '.images[] | [.release_ref, .image_id] | @tsv' "$manifest")
}

promote_release() {
  local commit="$1" manifest
  validate_commit "$commit"
  manifest="$(manifest_path "$commit")"
  [ -f "$manifest" ] || { log_error "Release manifest not found: $manifest"; return 1; }
  jq --arg promoted_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '.status = "successful" | .promoted_at = $promoted_at' "$manifest" >"${manifest}.tmp"
  mv "${manifest}.tmp" "$manifest"
  verify_release "$commit"
  log_info "Promoted local release: $commit"
}

activate_release() {
  local commit="$1" manifest release active
  verify_release "$commit"
  manifest="$(manifest_path "$commit")"
  while IFS=$'\t' read -r release active; do
    docker tag "$release" "$active"
  done < <(jq -r '.images[] | [.release_ref, .active_ref] | @tsv' "$manifest")
  log_info "Activated local release images: $commit"
}

case "${1:-}" in
  snapshot) [ "$#" -eq 2 ] && snapshot_release "$2" || exit 2 ;;
  promote) [ "$#" -eq 2 ] && promote_release "$2" || exit 2 ;;
  verify) [ "$#" -eq 2 ] && verify_release "$2" || exit 2 ;;
  activate) [ "$#" -eq 2 ] && activate_release "$2" || exit 2 ;;
  path) [ "$#" -eq 2 ] && manifest_path "$2" || exit 2 ;;
  *) log_error "Usage: local-release.sh {snapshot|promote|verify|activate|path} <commit>"; exit 1 ;;
esac
