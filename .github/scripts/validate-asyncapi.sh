#!/usr/bin/env bash
set -euo pipefail

SPEC_PATH="${1:-libs/py/contracts/generated/asyncapi/parsevk-contracts.yaml}"
SPEC_PATH="$(realpath "$SPEC_PATH")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PACKAGE_DIR="$REPOSITORY_ROOT/.github/asyncapi-validator"
VALIDATOR_DIR="${RUNNER_TEMP:-/tmp}/parsevk-asyncapi-validator"
LOG_PATH="${RUNNER_TEMP:-/tmp}/parsevk-asyncapi-validation.log"

rm -rf "$VALIDATOR_DIR"
mkdir -p "$VALIDATOR_DIR"
cp "$PACKAGE_DIR/package.json" "$VALIDATOR_DIR/package.json"
cp "$PACKAGE_DIR/package-lock.json" "$VALIDATOR_DIR/package-lock.json"
cp "$SCRIPT_DIR/validate-asyncapi.mjs" "$VALIDATOR_DIR/validate-asyncapi.mjs"

npm ci \
  --prefix "$VALIDATOR_DIR" \
  --ignore-scripts \
  --no-audit \
  --no-fund

set +e
(
  cd "$VALIDATOR_DIR"
  node validate-asyncapi.mjs "$SPEC_PATH"
) 2>&1 | tee "$LOG_PATH"
status=${PIPESTATUS[0]}
set -e

if [[ "$status" -ne 0 ]]; then
  detail="$(tail -n 160 "$LOG_PATH")"
  detail=${detail//'%'/'%25'}
  detail=${detail//$'\r'/'%0D'}
  detail=${detail//$'\n'/'%0A'}
  echo "::error title=AsyncAPI validation failure::$detail"
fi

exit "$status"
