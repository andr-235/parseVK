#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/.github/scripts/production/metadata.sh"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

export PROJECT_ROOT="$TMP_DIR"
export METADATA_FILE="$TMP_DIR/.deployment-metadata.json"

commit_a="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
commit_b="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

bash "$SCRIPT" write "$commit_a" "2026-07-30T10:00:00Z"
[ "$(jq -r '.last_successful_commit' "$METADATA_FILE")" = "$commit_a" ]
[ "$(jq -r '.previous_successful_commit' "$METADATA_FILE")" = "" ]

bash "$SCRIPT" write "$commit_b" "2026-07-30T11:00:00Z"
[ "$(jq -r '.last_successful_commit' "$METADATA_FILE")" = "$commit_b" ]
[ "$(jq -r '.previous_successful_commit' "$METADATA_FILE")" = "$commit_a" ]

bash "$SCRIPT" write "$commit_a" "2026-07-30T12:00:00Z"
[ "$(jq -r '.last_successful_commit' "$METADATA_FILE")" = "$commit_a" ]
[ "$(jq -r '.previous_successful_commit' "$METADATA_FILE")" = "$commit_b" ]

bash "$SCRIPT" write "$commit_a" "2026-07-30T13:00:00Z"
[ "$(jq -r '.last_successful_commit' "$METADATA_FILE")" = "$commit_a" ]
[ "$(jq -r '.previous_successful_commit' "$METADATA_FILE")" = "$commit_b" ]
[ "$(jq -r '.last_successful_deploy_time' "$METADATA_FILE")" = "2026-07-30T13:00:00Z" ]

echo "Deployment metadata current/previous release rotation is valid"
