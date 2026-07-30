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
  set_output "previous_successful_commit" "$(read_metadata_value previous_successful_commit)"
  set_output "previous_successful_deploy_time" "$(read_metadata_value previous_successful_deploy_time)"
}

write_metadata() {
  local commit="$1" deploy_time="$2" current_commit current_time
  current_commit="$(read_metadata_value last_successful_commit)"
  current_time="$(read_metadata_value last_successful_deploy_time)"

  if [ "$current_commit" = "$commit" ]; then
    jq --arg time "$deploy_time" '.last_successful_deploy_time = $time' \
      "${METADATA_FILE:-/dev/null}" >"${METADATA_FILE}.tmp"
    mv "${METADATA_FILE}.tmp" "$METADATA_FILE"
    return 0
  fi

  jq -n \
    --arg current "$commit" \
    --arg current_time "$deploy_time" \
    --arg previous "$current_commit" \
    --arg previous_time "$current_time" \
    '{
      last_successful_commit: $current,
      last_successful_deploy_time: $current_time,
      previous_successful_commit: $previous,
      previous_successful_deploy_time: $previous_time
    }' >"${METADATA_FILE}.tmp"
  mv "${METADATA_FILE}.tmp" "$METADATA_FILE"
}

case "${1:-}" in
  load)
    load_metadata
    ;;
  read-commit)
    read_metadata_value last_successful_commit
    ;;
  read-previous-commit)
    read_metadata_value previous_successful_commit
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
    log_error "Usage: metadata.sh {load|read-commit|read-previous-commit|read-time|write}"
    exit 1
    ;;
esac
