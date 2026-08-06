#!/usr/bin/env bash
set -euo pipefail

SPEC_PATH="${1:-libs/py/contracts/generated/asyncapi/parsevk-contracts.yaml}"
SPEC_PATH="$(realpath "$SPEC_PATH")"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATOR_DIR="${RUNNER_TEMP:-/tmp}/parsevk-asyncapi-validator"
LOG_PATH="${RUNNER_TEMP:-/tmp}/parsevk-asyncapi-validation.log"

rm -rf "$VALIDATOR_DIR"
mkdir -p "$VALIDATOR_DIR"
cat > "$VALIDATOR_DIR/package.json" <<'JSON'
{
  "name": "parsevk-asyncapi-validator",
  "private": true,
  "type": "module",
  "dependencies": {
    "@asyncapi/parser": "3.6.0"
  }
}
JSON
cp "$SCRIPT_DIR/validate-asyncapi.mjs" "$VALIDATOR_DIR/validate-asyncapi.mjs"

npm install \
  --prefix "$VALIDATOR_DIR" \
  --ignore-scripts \
  --no-audit \
  --no-fund \
  --package-lock=false

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
