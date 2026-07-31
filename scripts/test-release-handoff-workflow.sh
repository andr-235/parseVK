#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CI="$ROOT_DIR/.github/workflows/ci.yml"
SECURITY="$ROOT_DIR/.github/workflows/security.yml"
PUBLISH="$ROOT_DIR/.github/workflows/publish-release-images.yml"
COORDINATOR="$ROOT_DIR/.github/workflows/release-deploy-coordinator.yml"
RELEASE_CONFIG="$ROOT_DIR/.releaserc.json"

for file in "$CI" "$SECURITY" "$PUBLISH" "$COORDINATOR" "$RELEASE_CONFIG"; do
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
require_pattern "$CI" 'state=pending' "Full Release CI does not invalidate stale success before running"

require_pattern "$SECURITY" 'workflow_dispatch:' "Security cannot be dispatched"
require_pattern "$SECURITY" 'target_sha:' "Security dispatch is not bound to a target SHA"
require_pattern "$SECURITY" 'Verify dispatched security target' "Security does not verify its checkout"
require_pattern "$SECURITY" 'statuses: write' "Security cannot publish its release status"
require_pattern "$SECURITY" 'release/security' "Security status context is missing"
require_pattern "$SECURITY" 'state=pending' "Security does not invalidate stale success before running"

require_pattern "$CI" 'path: trusted-release-resolver' \
  "Full Release CI trusted resolver checkout is not isolated"
require_pattern "$SECURITY" 'path: trusted-release-resolver' \
  "Security trusted resolver checkout is not isolated"
publish_paths="$(grep -c 'path: trusted-release-resolver' "$PUBLISH")"
publish_stages="$(grep -c 'cp trusted-release-resolver/\.github/scripts/latest_release\.py' "$PUBLISH")"
[[ "$publish_paths" -eq 2 && "$publish_stages" -eq 2 ]] || {
  echo "Publisher must isolate and stage both trusted resolver checkouts"; exit 1;
}

require_pattern "$PUBLISH" 'release/full-ci' "Publisher does not require Full Release CI status"
require_pattern "$PUBLISH" 'release/security' "Publisher does not require Security status"
require_pattern "$PUBLISH" 'workflow_run\.id' "Publisher does not bind Security status to the triggering run"
reject_pattern "$PUBLISH" 'TARGET_SHA:.*workflow_run\.head_sha' \
  "Publisher still treats workflow_run.head_sha as the release SHA"

require_pattern "$COORDINATOR" 'release/full-ci' "Coordinator does not wait for Full Release CI status"
require_pattern "$COORDINATOR" 'release/security' "Coordinator does not wait for Security status"
reject_pattern "$COORDINATOR" 'head_sha=.*RELEASE_SHA' \
  "Coordinator still discovers release gates by workflow head SHA"

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

echo "Release status handoff and checkout isolation contracts are valid"
