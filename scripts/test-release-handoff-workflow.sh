#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CI="$ROOT_DIR/.github/workflows/ci.yml"
SECURITY="$ROOT_DIR/.github/workflows/security.yml"
PUBLISH="$ROOT_DIR/.github/workflows/publish-release-images.yml"
COORDINATOR="$ROOT_DIR/.github/workflows/release-deploy-coordinator.yml"
DEPLOY="$ROOT_DIR/.github/workflows/deploy.yml"
RELEASE_CONFIG="$ROOT_DIR/.releaserc.json"

for file in "$CI" "$SECURITY" "$PUBLISH" "$COORDINATOR" "$DEPLOY" "$RELEASE_CONFIG"; do
  [[ -f "$file" ]] || { echo "Required release handoff file not found: $file"; exit 1; }
done

require_pattern() {
  local file="$1" pattern="$2" message="$3"
  grep -Eq -- "$pattern" "$file" || { echo "$message"; exit 1; }
}

reject_pattern() {
  local file="$1" pattern="$2" message="$3"
  if grep -Eq -- "$pattern" "$file"; then echo "$message"; exit 1; fi
}

require_pattern "$CI" '^name: Full Release CI$' "Full Release CI workflow is missing"
require_pattern "$CI" 'workflow_dispatch:' "Full Release CI cannot be dispatched"
require_pattern "$CI" 'target_sha:' "Full Release CI is not bound to a target SHA"
require_pattern "$CI" 'base_sha:' "Full Release CI is missing the source SHA"
require_pattern "$CI" 'full_validation:' "Full Release CI does not require full validation"
require_pattern "$CI" 'Verify exact release target' "Full Release CI does not verify its checkout"
require_pattern "$CI" 'statuses: write' "Full Release CI cannot publish its release status"
require_pattern "$CI" 'release/full-ci' "Full Release CI status context is missing"
require_pattern "$CI" 'state=pending' "Full Release CI does not invalidate stale success"

require_pattern "$SECURITY" 'workflow_dispatch:' "Security cannot be dispatched"
require_pattern "$SECURITY" 'target_sha:' "Security dispatch is not bound to a target SHA"
require_pattern "$SECURITY" 'Verify dispatched security target' "Security does not verify its checkout"
require_pattern "$SECURITY" 'statuses: write' "Security cannot publish its release status"
require_pattern "$SECURITY" 'release/security' "Security status context is missing"
require_pattern "$SECURITY" 'state=pending' "Security does not invalidate stale success"

require_pattern "$CI" 'path: trusted-release-resolver' \
  "Full Release CI trusted resolver checkout is not isolated"
require_pattern "$SECURITY" 'path: trusted-release-resolver' \
  "Security trusted resolver checkout is not isolated"
publish_paths="$(grep -c 'path: trusted-release-resolver' "$PUBLISH" || true)"
publish_stages="$(grep -c 'cp trusted-release-resolver/\.github/scripts/latest_release\.py' "$PUBLISH" || true)"
[[ "$publish_paths" -eq 2 && "$publish_stages" -eq 2 ]] || {
  echo "Publisher must isolate and stage both trusted resolver checkouts"; exit 1;
}

require_pattern "$PUBLISH" 'workflow_dispatch:' "Publisher cannot be explicitly dispatched"
require_pattern "$PUBLISH" 'target_sha:' "Publisher dispatch is not bound to a release SHA"
require_pattern "$PUBLISH" 'coordinator_run_id:' "Publisher lacks coordinator authorization input"
reject_pattern "$PUBLISH" '^  workflow_run:' \
  "Publisher still relies on recursive workflow_run delivery"
require_pattern "$PUBLISH" 'Verify coordinator, release and gate statuses' \
  "Publisher does not verify coordinator authorization"
require_pattern "$PUBLISH" 'actions/runs/\$\{COORDINATOR_RUN_ID\}' \
  "Publisher does not inspect the authorizing coordinator run"
require_pattern "$PUBLISH" 'release/full-ci' "Publisher does not require Full Release CI status"
require_pattern "$PUBLISH" 'release/security' "Publisher does not require Security status"
require_pattern "$PUBLISH" 'release/immutable-ghcr' "Publisher does not publish immutable release status"
require_pattern "$PUBLISH" 'state=pending' "Publisher does not invalidate stale publication success"
require_pattern "$PUBLISH" 'Finalize immutable release status' \
  "Publisher does not finalize immutable status on every terminal path"
require_pattern "$PUBLISH" 'needs\.manifest\.result' \
  "Publisher terminal status does not inspect manifest result"
require_pattern "$PUBLISH" 'state=failure' \
  "Publisher does not mark failed publication"
reject_pattern "$PUBLISH" 'workflow_run\.head_sha' \
  "Publisher still treats workflow_run.head_sha as the release SHA"

require_pattern "$COORDINATOR" 'release/full-ci' "Coordinator does not wait for Full Release CI status"
require_pattern "$COORDINATOR" 'release/security' "Coordinator does not wait for Security status"
require_pattern "$COORDINATOR" 'actions/workflows/publish-release-images\.yml/dispatches' \
  "Coordinator does not explicitly dispatch the publisher"
require_pattern "$COORDINATOR" 'coordinator_run_id' \
  "Coordinator does not bind publisher authorization to its run"
require_pattern "$COORDINATOR" 'Wait for immutable publication' \
  "Coordinator does not wait for immutable image publication"
require_pattern "$COORDINATOR" 'seq 1 720' \
  "Coordinator publication wait is shorter than the publisher workload budget"
require_pattern "$COORDINATOR" 'timeout-minutes: 350' \
  "Coordinator timeout cannot cover publication and deployment"
require_pattern "$COORDINATOR" 'release/immutable-ghcr' \
  "Coordinator does not verify immutable release status"
require_pattern "$COORDINATOR" 'actions/workflows/deploy\.yml/dispatches' \
  "Coordinator does not explicitly dispatch production deployment"
require_pattern "$COORDINATOR" 'Wait for production deploy' \
  "Coordinator does not wait for production completion"
reject_pattern "$COORDINATOR" 'head_sha=.*RELEASE_SHA' \
  "Coordinator still discovers release gates by workflow head SHA"

require_pattern "$DEPLOY" 'workflow_dispatch:' "Production deploy cannot be explicitly dispatched"
reject_pattern "$DEPLOY" '^  workflow_run:' \
  "Production deploy still bypasses the coordinator through workflow_run"
require_pattern "$DEPLOY" 'expected_release_sha:' \
  "Production deploy is not bound to the coordinator release SHA"
require_pattern "$DEPLOY" 'release/full-ci' "Production deploy does not recheck Full Release CI"
require_pattern "$DEPLOY" 'release/security' "Production deploy does not recheck Security"
require_pattern "$DEPLOY" 'release/immutable-ghcr' \
  "Production deploy does not require immutable publication"

python3 - "$RELEASE_CONFIG" <<'PY'
import json
import sys

config = json.load(open(sys.argv[1], encoding="utf-8"))
analyzer = next(
    plugin for plugin in config["plugins"]
    if isinstance(plugin, list) and plugin[0] == "@semantic-release/commit-analyzer"
)
rules = {rule.get("scope"): rule.get("release") for rule in analyzer[1]["releaseRules"]}
expected = {"ai-review": False, "ci": False, "deploy": False}
if any(rules.get(scope) is not release for scope, release in expected.items()):
    raise SystemExit(f"Invalid non-product release rules: {rules}")
PY

echo "Explicit release publication and single-path production handoff contracts are valid"
