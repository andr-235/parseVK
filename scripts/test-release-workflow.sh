#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CI="$ROOT_DIR/.github/workflows/ci.yml"
RELEASE="$ROOT_DIR/.github/workflows/release.yml"
RELEASE_CONFIG="$ROOT_DIR/.releaserc.json"
PUBLISH="$ROOT_DIR/.github/workflows/publish-release-images.yml"
REUSABLE="$ROOT_DIR/.github/workflows/reusable-publish-image.yml"
SECURITY="$ROOT_DIR/.github/workflows/security.yml"
MANIFEST="$ROOT_DIR/.github/scripts/release_manifest.py"
MANIFEST_TEST="$ROOT_DIR/.github/scripts/test_release_manifest.py"

for file in "$CI" "$RELEASE" "$RELEASE_CONFIG" "$PUBLISH" "$REUSABLE" "$SECURITY" "$MANIFEST" "$MANIFEST_TEST"; do
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

require_pattern "$CI" 'workflow_dispatch:' "CI cannot be dispatched for semantic release commits"
require_pattern "$SECURITY" 'workflow_dispatch:' "Security cannot be dispatched for semantic release commits"
require_pattern "$SECURITY" 'if \[\[.*github\.event_name.*pull_request' \
  "Security workflow does not keep PR Docker scans incremental"
require_pattern "$SECURITY" 'else' "Security workflow has no full-release branch"
require_pattern "$SECURITY" '--purpose docker' "Security workflow does not build a Docker matrix"
require_pattern "$SECURITY" '--all' "Dispatched Security does not scan the complete release matrix"
reject_pattern "$SECURITY" 'github\.event_name.*push.*BASE_SHA' \
  "Main Security still scans only changed Docker images"

require_pattern "$RELEASE" 'actions: write' "Release workflow cannot dispatch validation workflows"
require_pattern "$RELEASE" 'group: semantic-release-main' "Semantic Release executions are not serialized"
require_pattern "$RELEASE" 'RELEASE_PARENT=.*RELEASE_SHA' "Release workflow does not inspect release parent"
require_pattern "$RELEASE" 'RELEASE_PARENT.*SOURCE_SHA' "Release parent is not bound to validated source"
require_pattern "$RELEASE" 'RELEASE_SUBJECT.*chore\\\(release\\\)' \
  "Release commit subject is not validated"
require_pattern "$RELEASE" "grep -qF '\[skip ci\]'" "Release commit marker is not validated"
require_pattern "$RELEASE" 'gh workflow run ci\.yml --ref main' "Release workflow does not dispatch CI"
require_pattern "$RELEASE" 'gh workflow run security\.yml --ref main' "Release workflow does not dispatch Security"
require_pattern "$RELEASE" 'git ls-remote origin refs/heads/main' "Release dispatch accepts stale main"
require_pattern "$RELEASE_CONFIG" '\[skip ci\]' "Semantic Release commit no longer prevents push recursion"

require_pattern "$PUBLISH" 'Security Scanning' "Release workflow is not gated by Security"
require_pattern "$PUBLISH" "workflow_run\.conclusion == 'success'" "Failed Security run can publish images"
require_pattern "$PUBLISH" "workflow_run\.event == 'workflow_dispatch'" \
  "Publisher accepts Security runs not explicitly dispatched for a release commit"
reject_pattern "$PUBLISH" "workflow_run\.event == 'push'" "Source push Security can publish images"
require_pattern "$PUBLISH" "workflow_run\.head_branch == 'main'" "Non-main commit can publish images"
require_pattern "$PUBLISH" 'event=workflow_dispatch' "Publisher does not verify dispatched CI"
require_pattern "$PUBLISH" 'chore\\\(release\\\):' "Publisher does not validate semantic release subject"
require_pattern "$PUBLISH" "grep -qF '\[skip ci\]'" "Publisher does not validate release marker"
require_pattern "$PUBLISH" 'git ls-remote origin refs/heads/main' "Publisher does not reject stale main"
require_pattern "$PUBLISH" "format\('pr-\{0\}'" "PR checks share production release concurrency"
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

for file in "$MANIFEST" "$MANIFEST_TEST"; do
  lines="$(wc -l < "$file")"
  (( lines <= 150 )) || { echo "Python module exceeds 150 lines: $file ($lines)"; exit 1; }
done

PYTHONPATH="$ROOT_DIR/.github/scripts" python3 "$MANIFEST_TEST" -v
python3 -m py_compile "$MANIFEST" "$MANIFEST_TEST"
echo "Semantic release gates and immutable GHCR publication contracts are valid"
