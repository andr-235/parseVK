#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PUBLISH="$ROOT_DIR/.github/workflows/publish-release-images.yml"
REUSABLE="$ROOT_DIR/.github/workflows/reusable-publish-image.yml"
MANIFEST="$ROOT_DIR/.github/scripts/release_manifest.py"
MANIFEST_TEST="$ROOT_DIR/.github/scripts/test_release_manifest.py"

for file in "$PUBLISH" "$REUSABLE" "$MANIFEST" "$MANIFEST_TEST"; do
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

require_pattern "$PUBLISH" 'Security Scanning' "Release workflow is not gated by Security"
require_pattern "$PUBLISH" "workflow_run\.conclusion == 'success'" "Failed Security run can publish images"
require_pattern "$PUBLISH" "workflow_run\.event == 'push'" "Non-push Security run can publish images"
require_pattern "$PUBLISH" "workflow_run\.head_branch == 'main'" "Non-main commit can publish images"
require_pattern "$PUBLISH" 'actions/workflows/ci\.yml/runs' "Release workflow does not verify CI"
require_pattern "$PUBLISH" 'git ls-remote origin refs/heads/main' "Release workflow does not reject stale main"
require_pattern "$PUBLISH" 'cancel-in-progress: true' "A newer main commit does not cancel stale publishing"
require_pattern "$PUBLISH" '--purpose docker' "Release image matrix is not catalog-driven"
require_pattern "$PUBLISH" 'uses: \./\.github/workflows/reusable-publish-image\.yml' \
  "Release workflow does not call reusable image publisher"
require_pattern "$PUBLISH" 'merge-multiple: true' "Digest metadata is not flattened for aggregation"
require_pattern "$PUBLISH" '--commit-sha' "Manifest is not bound to the validated commit"
require_pattern "$PUBLISH" 'release-manifest-.*target_sha' "Release artifact is not commit-addressed"
reject_pattern "$PUBLISH" 'workflow_dispatch:' "Release workflow accepts manual arbitrary execution"

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
echo "Immutable GHCR release workflow and manifest contracts are valid"
