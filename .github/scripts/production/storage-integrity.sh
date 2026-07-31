#!/usr/bin/env bash
set -euo pipefail

RELEASES_DIR="${RELEASES_DIR:-$(project_root)/.releases}"
METADATA_FILE="${DEPLOYMENT_METADATA_FILE:-$(project_root)/.deployment-metadata.json}"
LOCAL_RELEASE_SCRIPT="${LOCAL_RELEASE_SCRIPT:-$SCRIPT_DIR/local-release.sh}"
SERVICE_CATALOG_CLI="${SERVICE_CATALOG_CLI:-$(project_root)/.github/scripts/service_catalog.py}"

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
    and ((has("last_successful_commit") | not)
      or .last_successful_commit == null
      or ((.last_successful_commit | type) == "string"
        and (.last_successful_commit | test("^$|^[0-9a-f]{7,40}$"))))
    and ((has("previous_successful_commit") | not)
      or .previous_successful_commit == null
      or ((.previous_successful_commit | type) == "string"
        and (.previous_successful_commit | test("^$|^[0-9a-f]{7,40}$"))))
  ' "$METADATA_FILE" >/dev/null || {
    log_error "Deployment metadata is invalid: $METADATA_FILE"
    return 1
  }
}

resolve_targets() {
  if [ -f "$SERVICE_CATALOG_CLI" ]; then
    python3 "$SERVICE_CATALOG_CLI" \
      --repo-root "$(project_root)" changed --purpose deploy --all
    return
  fi
  compose config --format json \
    | jq -r '.services | to_entries[] | select((.value.build // null) != null) | .key' \
    | sort -u | paste -sd' ' -
}

manifest_path() {
  printf '%s/%s/release.json\n' "$RELEASES_DIR" "$1"
}

validate_manifest() {
  local commit="$1" manifest expected actual
  manifest="$(manifest_path "$commit")"
  [ -f "$manifest" ] || {
    log_error "Release manifest not found: $manifest"
    return 1
  }
  jq -e --arg commit "$commit" '
    .schema_version == 1
    and .commit_sha == $commit
    and .status == "successful"
    and ((.images | type) == "object")
    and ((.images | length) > 0)
    and all(.images[];
      type == "object"
      and ((.active_ref | type) == "string" and length > 0)
      and ((.release_ref | type) == "string" and length > 0)
      and ((.image_id | type) == "string" and length > 0))
  ' "$manifest" >/dev/null || {
    log_error "Release manifest schema is invalid: $manifest"
    return 1
  }
  expected="$(resolve_targets | tr ' ' '\n' | sed '/^$/d' | sort -u)"
  actual="$(jq -r '.images | keys[]' "$manifest" | sort -u)"
  [ -n "$expected" ] && [ "$actual" = "$expected" ] || {
    log_error "Release manifest image coverage is incomplete: $commit"
    return 1
  }
}

verify_release() {
  local commit="$1"
  [ -n "$commit" ] || return 0
  validate_manifest "$commit"
  PROJECT_ROOT="$(project_root)" \
    DEPLOYMENT_METADATA_FILE="$METADATA_FILE" \
    SERVICE_CATALOG_CLI="$SERVICE_CATALOG_CLI" \
    bash "$LOCAL_RELEASE_SCRIPT" verify "$commit"
}

verify_metadata_releases() {
  [ -f "$METADATA_FILE" ] || return 0
  local current previous
  current="$(metadata_commit last_successful_commit)"
  previous="$(metadata_commit previous_successful_commit)"
  verify_release "$current"
  [ -z "$previous" ] || [ "$previous" = "$current" ] || verify_release "$previous"
}
