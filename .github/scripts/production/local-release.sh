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
FAILED_RELEASE_RETENTION="${FAILED_RELEASE_RETENTION:-2}"
DEPLOYMENT_METADATA_FILE="${DEPLOYMENT_METADATA_FILE:-$(project_root)/.deployment-metadata.json}"

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
  if [ -f "$SERVICE_CATALOG_CLI" ]; then
    python3 "$SERVICE_CATALOG_CLI" --repo-root "$PROJECT_ROOT" changed --purpose deploy --all
    return 0
  fi

  log_warn "Service catalog unavailable; resolving build targets from Compose for release bootstrap" >&2
  compose config --format json \
    | jq -r '.services | to_entries[] | select((.value.build // null) != null) | .key' \
    | sort -u \
    | paste -sd' ' -
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

metadata_commit() {
  local key="$1"
  if [ ! -f "$DEPLOYMENT_METADATA_FILE" ]; then
    printf '\n'
    return 0
  fi
  jq -r ".${key} // empty" "$DEPLOYMENT_METADATA_FILE" 2>/dev/null || printf '\n'
}

remove_release_manifest() {
  local manifest="$1" release
  while IFS= read -r release; do
    [ -n "$release" ] || continue
    docker image rm "$release" >/dev/null 2>&1 || true
  done < <(jq -r '.images[]?.release_ref // empty' "$manifest")
  rm -rf "$(dirname "$manifest")"
}

prune_releases() {
  local successful_kept=0 failed_kept=0 manifest status commit
  local protected_current protected_previous
  protected_current="$(metadata_commit last_successful_commit)"
  protected_previous="$(metadata_commit previous_successful_commit)"
  mapfile -t manifests < <(
    find "$RELEASES_DIR" -mindepth 2 -maxdepth 2 -type f -name release.json -printf '%T@ %p\n' 2>/dev/null \
      | sort -rn | cut -d' ' -f2-
  )

  for manifest in "${manifests[@]}"; do
    status="$(jq -r '.status // empty' "$manifest")"
    commit="$(jq -r '.commit_sha // empty' "$manifest")"

    case "$status" in
      successful)
        successful_kept=$((successful_kept + 1))
        if [ "$commit" = "$protected_current" ] || [ "$commit" = "$protected_previous" ] || (( successful_kept <= RELEASE_RETENTION )); then
          continue
        fi
        log_info "Pruning successful local release: $commit"
        remove_release_manifest "$manifest"
        ;;
      failed)
        failed_kept=$((failed_kept + 1))
        if (( failed_kept <= FAILED_RELEASE_RETENTION )); then
          continue
        fi
        log_info "Pruning failed local release candidate: $commit"
        remove_release_manifest "$manifest"
        ;;
    esac
  done
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
  prune_releases
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

mark_failed_candidate() {
  local commit="$1" manifest status failed_at
  validate_commit "$commit"
  manifest="$(manifest_path "$commit")"
  if [ ! -f "$manifest" ]; then
    log_info "No local release candidate to mark failed: $commit"
    return 0
  fi

  status="$(jq -r '.status // empty' "$manifest")"
  if [ "$status" = "successful" ]; then
    log_error "Refusing to discard successful release or mark it failed: $commit"
    return 1
  fi

  failed_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  jq --arg failed_at "$failed_at" \
    '.status = "failed" | .failed_at = $failed_at' "$manifest" >"${manifest}.tmp"
  mv "${manifest}.tmp" "$manifest"
  log_warn "Preserved failed local release candidate for recovery: $commit"
  prune_releases
}

purge_candidate() {
  local commit="$1" manifest status
  validate_commit "$commit"
  manifest="$(manifest_path "$commit")"
  if [ ! -f "$manifest" ]; then
    log_info "No local release candidate to purge: $commit"
    return 0
  fi

  status="$(jq -r '.status // empty' "$manifest")"
  if [ "$status" = "successful" ]; then
    log_error "Refusing to purge successful release: $commit"
    return 1
  fi

  remove_release_manifest "$manifest"
  log_info "Purged local release candidate: $commit"
}

case "${1:-}" in
  snapshot) [ "$#" -eq 2 ] && snapshot_release "$2" || exit 2 ;;
  promote) [ "$#" -eq 2 ] && promote_release "$2" || exit 2 ;;
  verify) [ "$#" -eq 2 ] && verify_release "$2" || exit 2 ;;
  activate) [ "$#" -eq 2 ] && activate_release "$2" || exit 2 ;;
  mark-failed) [ "$#" -eq 2 ] && mark_failed_candidate "$2" || exit 2 ;;
  discard)
    [ "$#" -eq 2 ] || exit 2
    log_warn "Deprecated command 'discard'; use 'mark-failed'"
    mark_failed_candidate "$2"
    ;;
  purge) [ "$#" -eq 2 ] && purge_candidate "$2" || exit 2 ;;
  path) [ "$#" -eq 2 ] && manifest_path "$2" || exit 2 ;;
  *) log_error "Usage: local-release.sh {snapshot|promote|verify|activate|mark-failed|purge|path} <commit>"; exit 1 ;;
esac
