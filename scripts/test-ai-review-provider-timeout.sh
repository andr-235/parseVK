#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKFLOW="$ROOT_DIR/.github/workflows/ai-code-review.yml"
REVIEWER="$ROOT_DIR/.github/scripts/ai_review.py"

[[ -f "$WORKFLOW" ]] || { echo "AI review workflow not found: $WORKFLOW"; exit 1; }
[[ -f "$REVIEWER" ]] || { echo "Trusted reviewer not found: $REVIEWER"; exit 1; }

python3 - "$WORKFLOW" <<'PY'
import re
import sys
from pathlib import Path

workflow = Path(sys.argv[1]).read_text(encoding="utf-8")

expected = (
    '"provider":{"opencode":{"options":{"timeout":900000}}},'
    '"default_agent":"plan"'
)
normalized = re.sub(r"\s+", "", workflow)
if "".join(expected) not in normalized:
    raise SystemExit("OpenCode provider timeout is not pinned to 900000 ms before agent config")

if "timeout-minutes: 45" not in workflow:
    raise SystemExit("AI review job-level timeout is no longer 45 minutes")

if '"timeout":false' in normalized:
    raise SystemExit("AI review provider timeout must remain bounded")
PY

grep -Fq 'reason": "opencode-failed"' "$REVIEWER" || {
  echo "AI reviewer no longer fails closed on OpenCode errors"
  exit 1
}

echo "AI review provider timeout and fail-closed contract are valid"
