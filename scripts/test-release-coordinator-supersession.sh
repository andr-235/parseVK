#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE="$ROOT_DIR/.github/workflows/release.yml"
COORDINATOR="$ROOT_DIR/.github/workflows/release-deploy-coordinator.yml"
DEPLOY="$ROOT_DIR/.github/workflows/deploy.yml"

for file in "$RELEASE" "$COORDINATOR" "$DEPLOY"; do
  [[ -f "$file" ]] || { echo "Required workflow not found: $file"; exit 1; }
done

python3 - "$RELEASE" "$COORDINATOR" "$DEPLOY" <<'PY'
import re
import sys
from pathlib import Path

release = Path(sys.argv[1]).read_text(encoding="utf-8")
coordinator = Path(sys.argv[2]).read_text(encoding="utf-8")
deploy = Path(sys.argv[3]).read_text(encoding="utf-8")


def concurrency_body(workflow: str, name: str) -> str:
    lines = workflow.splitlines()
    try:
        start = lines.index("concurrency:") + 1
    except ValueError as error:
        raise SystemExit(f"{name} concurrency block is missing") from error
    body = []
    for line in lines[start:]:
        if not line.startswith("  "):
            break
        body.append(line.strip())
    if not body:
        raise SystemExit(f"{name} concurrency block is empty")
    return "\n".join(body)


if "  workflow_dispatch:" not in coordinator:
    raise SystemExit("Release coordinator cannot be explicitly dispatched")
if "  workflow_run:" in coordinator:
    raise SystemExit("Non-release workflow runs must not enter coordinator concurrency")
for required_input in ("release_sha:", "source_sha:"):
    if required_input not in coordinator:
        raise SystemExit(f"Coordinator input is missing: {required_input}")
if "EXPECTED_RELEASE_SHA: ${{ inputs.release_sha }}" not in coordinator:
    raise SystemExit("Coordinator does not validate the immutable release input")
if "EXPECTED_SOURCE_SHA: ${{ inputs.source_sha }}" not in coordinator:
    raise SystemExit("Coordinator does not validate the source input")

body = concurrency_body(coordinator, "Release coordinator")
if "group: release-deploy-coordinator" not in body:
    raise SystemExit("Release coordinator concurrency group changed unexpectedly")
if "cancel-in-progress: true" not in body:
    raise SystemExit("Latest created release must supersede obsolete orchestration")
if "cancel-in-progress: false" in body:
    raise SystemExit("Stale coordinator waits still block newer releases")

required_order = (
    "- name: Wait for immutable publication",
    "- name: Clean superseded production deploys",
    "- name: Dispatch production deploy",
    "- name: Wait for production deploy",
)
positions = [coordinator.find(marker) for marker in required_order]
if any(position < 0 for position in positions) or positions != sorted(positions):
    raise SystemExit("Coordinator publication, cleanup and deploy ordering is unsafe")
if "steps.cleanup.outcome == 'success'" not in coordinator:
    raise SystemExit("Production dispatch is not blocked on successful cleanup")
if re.search(r"actions/runs/.+?/cancel", coordinator):
    raise SystemExit("Coordinator must not directly cancel child production runs")

step_start = release.find("- name: Dispatch and confirm release commit gates")
step_end = release.find("\n      - name:", step_start + 1)
if step_start < 0:
    raise SystemExit("Release workflow does not dispatch created-release workflows")
release_step = release[step_start : step_end if step_end >= 0 else None]
if "if: steps.resolved_release.outputs.created == 'true'" not in release_step:
    raise SystemExit("Coordinator dispatch is not restricted to a created semantic release")
if "actions/workflows/release-deploy-coordinator.yml/dispatches" not in release_step:
    raise SystemExit("Created release does not explicitly dispatch the coordinator")
for payload_field in ("release_sha: $release_sha", "source_sha: $source_sha"):
    if payload_field not in release_step:
        raise SystemExit(f"Coordinator dispatch payload is missing {payload_field}")
if "GitHub did not create a new Release Deploy Coordinator run" not in release_step:
    raise SystemExit("Release workflow does not confirm coordinator creation")

production = concurrency_body(deploy, "Production deployment")
if "group: production-deployment" not in production:
    raise SystemExit("Production deployment concurrency group changed unexpectedly")
if "cancel-in-progress: false" not in production:
    raise SystemExit("An active production deployment must not be cancelled")
PY

echo "Created-release coordinator supersession and active production protection are valid"
