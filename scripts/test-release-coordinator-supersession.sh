#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COORDINATOR="$ROOT_DIR/.github/workflows/release-deploy-coordinator.yml"
DEPLOY="$ROOT_DIR/.github/workflows/deploy.yml"

for file in "$COORDINATOR" "$DEPLOY"; do
  [[ -f "$file" ]] || { echo "Required workflow not found: $file"; exit 1; }
done

python3 - "$COORDINATOR" "$DEPLOY" <<'PY'
import re
import sys
from pathlib import Path

coordinator = Path(sys.argv[1]).read_text(encoding="utf-8")
deploy = Path(sys.argv[2]).read_text(encoding="utf-8")

block = re.search(
    r"(?ms)^concurrency:\n(?P<body>(?:^[ ]+.*\n)+?)^\n",
    coordinator,
)
if block is None:
    raise SystemExit("Release coordinator concurrency block is missing")
body = block.group("body")
if "group: release-deploy-coordinator" not in body:
    raise SystemExit("Release coordinator concurrency group changed unexpectedly")
if "cancel-in-progress: true" not in body:
    raise SystemExit("Latest release must supersede an obsolete coordinator wait")
if "cancel-in-progress: false" in body:
    raise SystemExit("Stale coordinator waits still block newer releases")

required_order = (
    "- name: Wait for immutable publication",
    "- name: Clean superseded production deploys",
    "- name: Dispatch production deploy",
    "- name: Wait for production deploy",
)
positions = [coordinator.find(marker) for marker in required_order]
if any(position < 0 for position in positions):
    raise SystemExit("Coordinator lost a required publication/cleanup/deploy step")
if positions != sorted(positions):
    raise SystemExit("Coordinator release handoff ordering is unsafe")

if "steps.cleanup.outcome == 'success'" not in coordinator:
    raise SystemExit("Production dispatch is not blocked on successful cleanup")
if re.search(r"actions/runs/.+?/cancel", coordinator):
    raise SystemExit("Coordinator must not directly cancel child production runs")

production_block = re.search(
    r"(?ms)^concurrency:\n(?P<body>(?:^[ ]+.*\n)+?)^\n",
    deploy,
)
if production_block is None:
    raise SystemExit("Production deployment concurrency block is missing")
production = production_block.group("body")
if "group: production-deployment" not in production:
    raise SystemExit("Production deployment concurrency group changed unexpectedly")
if "cancel-in-progress: false" not in production:
    raise SystemExit("An active production deployment must not be cancelled")
PY

echo "Latest coordinator supersession and active production protection are valid"
