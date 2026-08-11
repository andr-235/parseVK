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
DEPLOY="$ROOT_DIR/.github/workflows/deploy.yml"
CLEANUP="$ROOT_DIR/.github/workflows/deploy-queue-cleanup.yml"
CANCEL_SCRIPT="$ROOT_DIR/.github/scripts/cancel-superseded-deploys.sh"
CANCEL_TEST="$ROOT_DIR/scripts/test-cancel-superseded-deploys.sh"
HANDOFF="$ROOT_DIR/scripts/test-release-handoff-workflow.sh"
SERVICE_CATALOG="$ROOT_DIR/.github/scripts/service_catalog.py"
SERVICE_CATALOG_TEST="$ROOT_DIR/.github/scripts/test_service_catalog.py"
MANIFEST="$ROOT_DIR/.github/scripts/release_manifest.py"
MANIFEST_TEST="$ROOT_DIR/.github/scripts/test_release_manifest.py"

for file in "$PR_CI" "$CI" "$RELEASE" "$RELEASE_CONFIG" "$PUBLISH" "$REUSABLE" "$SECURITY" "$DEPLOY" "$CLEANUP" "$CANCEL_SCRIPT" "$CANCEL_TEST" "$HANDOFF" "$SERVICE_CATALOG" "$SERVICE_CATALOG_TEST" "$MANIFEST" "$MANIFEST_TEST"; do
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

require_pattern "$DEPLOY" '^run-name: Deploy release .*inputs\.expected_release_sha' \
  "Production deploy run name does not expose the immutable release input"
require_pattern "$DEPLOY" 'name: Fence stale queued release' \
  "Production deploy has no self-hosted stale-release fence"
grep -Fq 'git show origin/main:.github/scripts/latest_release.py > "$RUNNER_TEMP/latest_release.py"' "$DEPLOY" || {
  echo "Production fence does not load the trusted latest-release resolver into the runner temp directory"; exit 1;
}
grep -Fq 'RELEASE_JSON="$(python3 "$RUNNER_TEMP/latest_release.py" --ref origin/main)"' "$DEPLOY" || {
  echo "Production fence does not execute the trusted latest-release resolver from the runner temp directory"; exit 1;
}
require_pattern "$DEPLOY" 'LATEST_RELEASE_SHA.*TARGET_SHA' \
  "Production fence does not compare the queued target with the latest release"
FENCE_LINE="$(grep -n 'name: Fence stale queued release' "$DEPLOY" | head -1 | cut -d: -f1)"
METADATA_LINE="$(grep -n 'name: Load deployment metadata' "$DEPLOY" | head -1 | cut -d: -f1)"
[[ -n "$FENCE_LINE" && -n "$METADATA_LINE" && "$FENCE_LINE" -lt "$METADATA_LINE" ]] || {
  echo "Production stale-release fence must run before /opt/parseVK metadata access"
  exit 1
}

require_pattern "$CLEANUP" 'workflow_dispatch:' \
  "Standalone deploy queue cleanup cannot be manually dispatched"
reject_pattern "$CLEANUP" '^  workflow_run:' \
  "Standalone deploy queue cleanup still relies on suppressed workflow_run delivery"
require_pattern "$CLEANUP" 'actions: write' "Deploy queue cleanup cannot cancel workflow runs"
require_pattern "$CLEANUP" 'cancel-superseded-deploys\.sh' \
  "Deploy queue cleanup does not invoke the safe cancellation script"
require_pattern "$CANCEL_SCRIPT" '--paginate --slurp' \
  "Cancellation script does not enumerate every page of deploy runs"
require_pattern "$CANCEL_SCRIPT" 'display_title' \
  "Cancellation script does not read the immutable release run name"
require_pattern "$CANCEL_SCRIPT" 'chore\(release\):' \
  "Cancellation script lacks the strict legacy semantic-release fallback"
require_pattern "$CANCEL_SCRIPT" 'status == "in_progress"' \
  "Cancellation script does not protect an active deployment"
require_pattern "$CANCEL_SCRIPT" '/cancel' \
  "Cancellation script does not cancel superseded workflow runs"

for file in "$SERVICE_CATALOG" "$MANIFEST" "$MANIFEST_TEST"; do
  lines="$(wc -l < "$file")"
  (( lines <= 150 )) || { echo "Python module exceeds 150 lines: $file ($lines)"; exit 1; }
done

PYTHONPATH="$ROOT_DIR/.github/scripts" python3 "$SERVICE_CATALOG_TEST" -v
PYTHONPATH="$ROOT_DIR/.github/scripts" python3 "$MANIFEST_TEST" -v
python3 -m py_compile "$SERVICE_CATALOG" "$MANIFEST" "$MANIFEST_TEST"
bash "$CANCEL_TEST"
bash "$HANDOFF"
echo "Explicit full release gates, immutable publication and production handoff contracts are valid"
