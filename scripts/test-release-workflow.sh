#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PR_CI="$ROOT_DIR/.github/workflows/pr-ci.yml"
CI="$ROOT_DIR/.github/workflows/ci.yml"
RELEASE="$ROOT_DIR/.github/workflows/release.yml"
RELEASE_CONFIG="$ROOT_DIR/.releaserc.json"
PUBLISH="$ROOT_DIR/.github/workflows/publish-release-images.yml"
REUSABLE="$ROOT_DIR/.github/workflows/reusable-publish-image.yml"
SECURITY="$ROOT_DIR/.github/workflows/security.yml"
HANDOFF="$ROOT_DIR/scripts/test-release-handoff-workflow.sh"
SERVICE_CATALOG="$ROOT_DIR/.github/scripts/service_catalog.py"
SERVICE_CATALOG_TEST="$ROOT_DIR/.github/scripts/test_service_catalog.py"
MANIFEST="$ROOT_DIR/.github/scripts/release_manifest.py"
MANIFEST_TEST="$ROOT_DIR/.github/scripts/test_release_manifest.py"

for file in "$PR_CI" "$CI" "$RELEASE" "$RELEASE_CONFIG" "$PUBLISH" "$REUSABLE" "$SECURITY" "$HANDOFF" "$SERVICE_CATALOG" "$SERVICE_CATALOG_TEST" "$MANIFEST" "$MANIFEST_TEST"; do
  [[ -f "$file" ]] || { echo "Required immutable release file not found: $file"; exit 1; }
done

require_pattern() {
  local file="$1" pattern="$2" message="$3"
  grep -Eq -- "$pattern" "$file" || { echo "$message"; exit 1; }
}

reject_pattern() {
  local file="$1" pattern="$2" message="$3"
  if grep -Eq -- "$pattern" "$file"; then echo "$message"; exit 1; fi
}

require_pattern "$PR_CI" '^name: CI$' "Incremental CI lost the workflow name used by Semantic Release"
require_pattern "$PR_CI" 'pull_request:' "Incremental CI no longer validates pull requests"
require_pattern "$PR_CI" 'push:' "Incremental CI no longer validates main pushes"

grep -Fq '[[ "$RELEASE_SUBJECT" == chore\(release\):* ]]' "$CI" || {
  echo "Full Release CI does not restrict validation to semantic-release commits"; exit 1;
}
require_pattern "$CI" "grep -qF '\[skip ci\]'" "Full Release CI does not validate the release marker"
require_pattern "$CI" 'RELEASE_PARENT.*BASE_SHA' "Full Release CI is not bound to the validated source"
require_pattern "$CI" '--purpose pytest' "Full Release CI does not build the Python test matrix"
require_pattern "$CI" '--purpose migration' "Full Release CI does not build the migration matrix"
require_pattern "$CI" '--all' "Full Release CI does not select the complete release matrix"
require_pattern "$CI" 'name: Full Release Gate' "Full Release CI has no aggregate gate"

require_pattern "$SECURITY" 'if \[\[.*github\.event_name.*pull_request' \
  "Security workflow does not keep PR Docker scans incremental"
require_pattern "$SECURITY" '--purpose docker' "Security workflow does not build a Docker matrix"
require_pattern "$SECURITY" '--all' "Dispatched Security does not scan the complete matrix"
require_pattern "$SECURITY" "fetch-depth:.*github\.event_name == 'workflow_dispatch'.*&& 2" \
  "Release secret scan is not bounded to the release commit and parent"

require_pattern "$RELEASE" 'actions: write' "Release workflow cannot dispatch validation workflows"
require_pattern "$RELEASE" 'group: semantic-release-main' "Semantic Release executions are not serialized"
require_pattern "$RELEASE" 'Verify source commit is current main' "Stale sources can run Semantic Release"
require_pattern "$RELEASE" 'CURRENT_MAIN.*SOURCE_SHA' "Source commit is not compared with current main"
require_pattern "$RELEASE" "source_gate\.outputs\.stale != 'true'" "Release steps ignore the stale source gate"
require_pattern "$RELEASE" 'RELEASE_PARENT=.*RELEASE_SHA' "Release workflow does not inspect its parent"
require_pattern "$RELEASE" 'RELEASE_PARENT.*SOURCE_SHA' "Release parent is not bound to validated source"
grep -Fq '[[ "$RELEASE_SUBJECT" == chore\(release\):* ]]' "$RELEASE" || {
  echo "Release commit subject is not validated"; exit 1;
}
require_pattern "$RELEASE" "grep -qF '\[skip ci\]'" "Release commit marker is not validated"
require_pattern "$RELEASE" 'actions/workflows/ci\.yml/dispatches' "Release does not dispatch Full Release CI"
require_pattern "$RELEASE" 'actions/workflows/security\.yml/dispatches' "Release does not dispatch Security"
require_pattern "$RELEASE" 'full_validation: true' "Release does not request full CI validation"
require_pattern "$RELEASE" 'PRE_CI_RUN_ID' "Release does not snapshot the previous Full CI run"
require_pattern "$RELEASE" 'PRE_SECURITY_RUN_ID' "Release does not snapshot the previous Security run"
require_pattern "$RELEASE" 'GitHub did not create a new Full Release CI run' \
  "Release does not fail when Full Release CI dispatch is missing"
require_pattern "$RELEASE" 'GitHub did not create a new Security Scanning run' \
  "Release does not fail when Security dispatch is missing"
reject_pattern "$RELEASE" 'gh workflow run' "Release still uses fire-and-forget workflow commands"
require_pattern "$RELEASE_CONFIG" '\[skip ci\]' "Semantic Release commit no longer prevents recursion"

require_pattern "$PUBLISH" 'workflow_dispatch:' "Publisher cannot be explicitly dispatched"
require_pattern "$PUBLISH" 'target_sha:' "Publisher is not bound to an immutable release SHA"
require_pattern "$PUBLISH" 'coordinator_run_id:' "Publisher lacks coordinator authorization"
reject_pattern "$PUBLISH" '^  workflow_run:' "Publisher still depends on recursive workflow_run delivery"
grep -Fq '[[ "$RELEASE_SUBJECT" == chore\(release\):* ]]' "$PUBLISH" || {
  echo "Publisher does not validate semantic release subject"; exit 1;
}
require_pattern "$PUBLISH" "grep -qF '\[skip ci\]'" "Publisher does not validate release marker"
require_pattern "$PUBLISH" 'git ls-remote origin refs/heads/main' "Publisher accepts stale main"
require_pattern "$PUBLISH" '--purpose docker' "Release image matrix is not catalog-driven"
require_pattern "$PUBLISH" 'uses: \./\.github/workflows/reusable-publish-image\.yml' \
  "Release workflow does not call the reusable image publisher"
require_pattern "$PUBLISH" 'merge-multiple: true' "Digest metadata is not flattened"
require_pattern "$PUBLISH" '--commit-sha' "Manifest is not bound to the validated commit"
require_pattern "$PUBLISH" 'release-manifest-.*target_sha' "Release artifact is not commit-addressed"
require_pattern "$PUBLISH" 'release/immutable-ghcr' "Publisher does not create durable release status"
require_pattern "$PUBLISH" '\.github/workflows/release-deploy-coordinator\.yml' \
  "Coordinator changes do not run publication contracts"
require_pattern "$PUBLISH" '\.releaserc\.json' "Semantic Release config changes do not run contracts"

require_pattern "$REUSABLE" 'packages: write' "Reusable publisher cannot push to GHCR"
require_pattern "$REUSABLE" 'attestations: write' "Reusable publisher cannot write attestations"
require_pattern "$REUSABLE" 'push: true' "Reusable publisher does not push images"
require_pattern "$REUSABLE" 'tags:.*target_sha' "Published image is not tagged by commit SHA"
require_pattern "$REUSABLE" 'sbom: true' "Published image does not include SBOM"
require_pattern "$REUSABLE" 'provenance: mode=max' "Published image does not include provenance"
require_pattern "$REUSABLE" 'git ls-remote origin refs/heads/main' "Reusable publisher accepts stale main"
require_pattern "$REUSABLE" 'sha256:\[0-9a-f\].*64' "Image digest is not validated"
require_pattern "$REUSABLE" 'imagetools inspect' "Published digest is not checked in GHCR"

for file in "$SERVICE_CATALOG" "$MANIFEST" "$MANIFEST_TEST"; do
  lines="$(wc -l < "$file")"
  (( lines <= 150 )) || { echo "Python module exceeds 150 lines: $file ($lines)"; exit 1; }
done

PYTHONPATH="$ROOT_DIR/.github/scripts" python3 "$SERVICE_CATALOG_TEST" -v
PYTHONPATH="$ROOT_DIR/.github/scripts" python3 "$MANIFEST_TEST" -v
python3 -m py_compile "$SERVICE_CATALOG" "$MANIFEST" "$MANIFEST_TEST"
bash "$HANDOFF"
echo "Explicit full release gates, immutable publication and production handoff contracts are valid"
