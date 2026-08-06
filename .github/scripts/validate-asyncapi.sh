#!/usr/bin/env bash
set -euo pipefail

SPEC_PATH="${1:-libs/py/contracts/generated/asyncapi/parsevk-contracts.yaml}"
LOG_PATH="${RUNNER_TEMP:-/tmp}/parsevk-asyncapi-validation.log"

set +e
CI=true npx --yes @asyncapi/cli@6.0.2 validate "$SPEC_PATH" \
  --log-diagnostics \
  --diagnostics-format text \
  2>&1 | tee "$LOG_PATH"
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
