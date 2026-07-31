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
SERVICE_CATALOG="$ROOT_DIR/.github/scripts/service_catalog.py"
SERVICE_CATALOG_TEST="$ROOT_DIR/.github/scripts/test_service_catalog.py"
MANIFEST="$ROOT_DIR/.github/scripts/release_manifest.py"
MANIFEST_TEST="$ROOT_DIR/.github/scripts/test_release_manifest.py"

for file in "$PR_CI" "$CI" "$RELEASE" "$RELEASE_CONFIG" "$PUBLISH" "$REUSABLE" "$SECURITY" "$SERVICE_CATALOG" "$SERVICE_CATALOG_TEST" "$MANIFEST" "$MANIFEST_TEST"; do
  [[ -f "$file" ]] || { echo "Required immutable release file not found: $file"; exit 1; }
done

grep -q 'workflow_call:' "$REUSABLE" || {
  echo "Image publisher is not reusable"; exit 1;
}

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

require_pattern "$CI" '^name: Full Release CI$' "Full Release CI workflow is missing"
require_pattern "$CI" 'workflow_dispatch:' "Full Release CI cannot be dispatched for semantic release commits"
require_pattern "$CI" 'target_sha:' "Full Release CI is not bound to an exact target SHA"
require_pattern "$CI" 'base_sha:' "Full Release CI is missing the validated source SHA"
require_pattern "$CI" 'full_validation:' "Full Release CI does not require explicit full validation"
require_pattern "$CI" 'Verify exact release target' "Full Release CI does not verify its exact checkout"
grep -Fq '[[ "$RELEASE_SUBJECT" == chore\(release\):* ]]' "$CI" || {
  echo "Full Release CI does not restrict validation to semantic-release commits"; exit 1;
}
require_pattern "$CI" "grep -qF '\[skip ci\]'" \
  "Full Release CI does not validate the semantic-release marker"
require_pattern "$CI" 'RELEASE_PARENT.*BASE_SHA' \
  "Full Release CI does not bind the release parent to the validated source"
require_pattern "$CI" '--purpose pytest' "Full Release CI does not build the Python test matrix"
require_pattern "$CI" '--purpose migration' "Full Release CI does not build the migration matrix"
require_pattern "$CI" '--all' "Full Release CI does not select the complete release matrix"
require_pattern "$CI" 'name: Full Release Gate' "Full Release CI has no aggregate release gate"

require_pattern "$SECURITY" 'workflow_dispatch:' "Security cannot be dispatched for semantic release commits"
require_pattern "$SECURITY" 'target_sha:' "Security dispatch is not bound to an exact target SHA"
require_pattern "$SECURITY" 'Verify dispatched security target' "Security does not verify its dispatched checkout"
require_pattern "$SECURITY" 'if \[\[.*github\.event_name.*pull_request' \
  "Security workflow does not keep PR Docker scans incremental"
require_pattern "$SECURITY" 'else' "Security workflow has no full-release branch"
require_pattern "$SECURITY" '--purpose docker' "Security workflow does not build a Docker matrix"
require_pattern "$SECURITY" '--all' "Dispatched Security does not scan the complete release matrix"
require_pattern "$SECURITY" "fetch-depth:.*github\.event_name == 'workflow_dispatch'.*&& 2" \
  "Release secret scan is not bounded to the release commit and its parent"
reject_pattern "$SECURITY" 'github\.event_name.*push.*BASE_SHA' \
  "Main Security still scans only changed Docker images"

require_pattern "$RELEASE" 'actions: write' "Release workflow cannot dispatch validation workflows"
require_pattern "$RELEASE" 'group: semantic-release-main' "Semantic Release executions are not serialized"
require_pattern "$RELEASE" 'Verify source commit is current main' "Stale CI sources can run Semantic Release"
require_pattern "$RELEASE" 'CURRENT_MAIN.*SOURCE_SHA' "Source commit is not compared with current main"
require_pattern "$RELEASE" "source_gate\.outputs\.stale != 'true'" \
  "Semantic Release steps do not honor the stale source gate"
require_pattern "$RELEASE" 'RELEASE_PARENT=.*RELEASE_SHA' "Release workflow does not inspect release parent"
require_pattern "$RELEASE" 'RELEASE_PARENT.*SOURCE_SHA' "Release parent is not bound to validated source"
grep -Fq '[[ "$RELEASE_SUBJECT" == chore\(release\):* ]]' "$RELEASE" || {
  echo "Release commit subject is not validated"; exit 1;
}
require_pattern "$RELEASE" "grep -qF '\[skip ci\]'" "Release commit marker is not validated"
require_pattern "$RELEASE" 'actions/workflows/ci\.yml/dispatches' \
  "Release workflow does not dispatch Full Release CI through the Actions API"
require_pattern "$RELEASE" 'actions/workflows/security\.yml/dispatches' \
  "Release workflow does not dispatch Security through the Actions API"
require_pattern "$RELEASE" 'full_validation: true' "Release does not request full CI validation"
require_pattern "$RELEASE" 'PRE_CI_RUN_ID' "Release does not snapshot the previous Full Release CI run"
require_pattern "$RELEASE" 'PRE_SECURITY_RUN_ID' "Release does not snapshot the previous Security run"
require_pattern "$RELEASE" 'CI_RUN_ID.*PRE_CI_RUN_ID' \
  "Release does not confirm that GitHub created a new Full Release CI run"
require_pattern "$RELEASE" 'SECURITY_RUN_ID.*PRE_SECURITY_RUN_ID' \
  "Release does not confirm that GitHub created a new Security run"
require_pattern "$RELEASE" 'GitHub did not create a new Full Release CI run' \
  "Release has no explicit failure for a missing Full Release CI dispatch"
require_pattern "$RELEASE" 'GitHub did not create a new Security Scanning run' \
  "Release has no explicit failure for a missing Security dispatch"
require_pattern "$RELEASE" 'GITHUB_STEP_SUMMARY' \
  "Release does not publish confirmed gate URLs in the run summary"
require_pattern "$RELEASE" 'git ls-remote origin refs/heads/main' "Release dispatch accepts stale main"
reject_pattern "$RELEASE" 'gh workflow run' \
  "Release still uses fire-and-forget gh workflow run commands"
require_pattern "$RELEASE_CONFIG" '\[skip ci\]' "Semantic Release commit no longer prevents push recursion"

require_pattern "$PUBLISH" 'Security Scanning' "Release workflow is not gated by Security"
require_pattern "$PUBLISH" "workflow_run\.conclusion == 'success'" "Failed Security run can publish images"
require_pattern "$PUBLISH" "workflow_run\.event == 'workflow_dispatch'" \
  "Publisher accepts Security runs not explicitly dispatched for a release commit"
reject_pattern "$PUBLISH" "workflow_run\.event == 'push'" "Source push Security can publish images"
require_pattern "$PUBLISH" "workflow_run\.head_branch == 'main'" "Non-main commit can publish images"
require_pattern "$PUBLISH" 'actions/workflows/ci\.yml/runs' "Publisher does not verify Full Release CI by workflow file"
require_pattern "$PUBLISH" 'event=workflow_dispatch' "Publisher does not verify dispatched Full Release CI"
grep -Fq '[[ "$RELEASE_SUBJECT" == chore\(release\):* ]]' "$PUBLISH" || {
  echo "Publisher does not validate semantic release subject"; exit 1;
}
require_pattern "$PUBLISH" "grep -qF '\[skip ci\]'" "Publisher does not validate release marker"
require_pattern "$PUBLISH" 'git ls-remote origin refs/heads/main' "Publisher does not reject stale main"
require_pattern "$PUBLISH" "format\('pr-\{0\}'" "PR checks share production release concurrency"
require_pattern "$PUBLISH" "format\('ignored-\{0\}'" \
  "Ignored Security runs can cancel an active production release"
require_pattern "$PUBLISH" "workflow_run\.event != 'workflow_dispatch'" \
  "Ignored Security concurrency is not restricted to non-release runs"
require_pattern "$PUBLISH" "\|\| 'main'" "Production release concurrency group is missing"
require_pattern "$PUBLISH" 'cancel-in-progress: true' "A newer main commit does not cancel stale publishing"
require_pattern "$PUBLISH" '--purpose docker' "Release image matrix is not catalog-driven"
require_pattern "$PUBLISH" 'uses: \./\.github/workflows/reusable-publish-image\.yml' \
  "Release workflow does not call reusable image publisher"
require_pattern "$PUBLISH" 'merge-multiple: true' "Digest metadata is not flattened for aggregation"
require_pattern "$PUBLISH" '--commit-sha' "Manifest is not bound to the validated commit"
require_pattern "$PUBLISH" 'release-manifest-.*target_sha' "Release artifact is not commit-addressed"
require_pattern "$PUBLISH" 'statuses: write' "Publisher cannot record immutable release status"
require_pattern "$PUBLISH" 'release/immutable-ghcr' "Publisher does not create durable release status"
require_pattern "$PUBLISH" '\.github/workflows/release\.yml' "Release workflow changes do not run contracts"
require_pattern "$PUBLISH" '\.github/workflows/ci\.yml' "Full Release CI changes do not run contracts"
require_pattern "$PUBLISH" '\.releaserc\.json' "Semantic Release config changes do not run contracts"
reject_pattern "$PUBLISH" 'workflow_dispatch:' "Publisher accepts manual arbitrary image publication"

require_pattern "$REUSABLE" 'packages: write' "Reusable publisher cannot push to GHCR"
require_pattern "$REUSABLE" 'attestations: write' "Reusable publisher cannot write attestations"
require_pattern "$REUSABLE" 'push: true' "Reusable publisher does not push images"
require_pattern "$REUSABLE" 'tags:.*target_sha' "Published image is not tagged by commit SHA"
require_pattern "$REUSABLE" 'sbom: true' "Published image does not include SBOM"
require_pattern "$REUSABLE" 'provenance: mode=max' "Published image does not include provenance"
require_pattern "$REUSABLE" 'git ls-remote origin refs/heads/main' "Reusable publisher accepts stale main"
require_pattern "$REUSABLE" 'sha256:\[0-9a-f\].*64' "Image digest is not validated"
require_pattern "$REUSABLE" 'imagetools inspect' "Published digest is not checked in GHCR"
require_pattern "$REUSABLE" 'published-image-.*service' "Per-service digest metadata is not uploaded"

for file in "$SERVICE_CATALOG" "$MANIFEST" "$MANIFEST_TEST"; do
  lines="$(wc -l < "$file")"
  (( lines <= 150 )) || { echo "Python module exceeds 150 lines: $file ($lines)"; exit 1; }
done

PYTHONPATH="$ROOT_DIR/.github/scripts" python3 "$SERVICE_CATALOG_TEST" -v
PYTHONPATH="$ROOT_DIR/.github/scripts" python3 "$MANIFEST_TEST" -v
python3 -m py_compile "$SERVICE_CATALOG" "$MANIFEST" "$MANIFEST_TEST"
echo "Incremental CI, confirmed exact full release gates and immutable publication contracts are valid"
