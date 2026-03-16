#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/common.sh"

METADATA_FILE="${METADATA_FILE:-$(project_root)/.deployment-metadata.json}"

read_metadata_value() {
  local key="$1"
  if [ ! -f "$METADATA_FILE" ]; then
    printf '\n'
    return 0
  fi

  jq -r ".${key} // empty" "$METADATA_FILE" 2>/dev/null || printf '\n'
}

load_metadata() {
  set_output "last_successful_commit" "$(read_metadata_value last_successful_commit)"
  set_output "last_successful_deploy_time" "$(read_metadata_value last_successful_deploy_time)"
}

write_metadata() {
  local commit="$1"
  local deploy_time="$2"

  if [ -f "$METADATA_FILE" ]; then
    jq --arg commit "$commit" \
      --arg time "$deploy_time" \
      '.last_successful_commit = $commit | .last_successful_deploy_time = $time' \
      "$METADATA_FILE" >"${METADATA_FILE}.tmp"
    mv "${METADATA_FILE}.tmp" "$METADATA_FILE"
  else
    printf '{\n  "last_successful_commit": "%s",\n  "last_successful_deploy_time": "%s"\n}\n' \
      "$commit" "$deploy_time" >"$METADATA_FILE"
  fi
}

case "${1:-}" in
  load)
    load_metadata
    ;;
  read-commit)
    read_metadata_value last_successful_commit
    ;;
  read-time)
    read_metadata_value last_successful_deploy_time
    ;;
  write)
    if [ "$#" -ne 3 ]; then
      log_error "Usage: metadata.sh write <commit> <utc_time>"
      exit 1
    fi
    write_metadata "$2" "$3"
    ;;
  *)
    log_error "Usage: metadata.sh {load|read-commit|read-time|write}"
    exit 1
    ;;
esac

