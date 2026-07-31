#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/.github/scripts/production/local-release.sh"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$TMP_DIR/project/.github/scripts" "$TMP_DIR/bin" "$TMP_DIR/docker-state"
cat >"$TMP_DIR/project/.github/scripts/service_catalog.py" <<'PY'
#!/usr/bin/env python3
print("frontend api-gateway")
PY
chmod +x "$TMP_DIR/project/.github/scripts/service_catalog.py"

cat >"$TMP_DIR/bin/docker" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
state="${FAKE_DOCKER_STATE:?}"
key() { printf '%s' "$1" | tr '/:' '__'; }
case "$1 $2" in
  "image inspect")
    ref="$3"
    file="$state/$(key "$ref")"
    [ -f "$file" ] || exit 1
    cat "$file"
    ;;
  "image rm")
    rm -f "$state/$(key "$3")"
    ;;
  "tag "*)
    src="$2"
    dst="$3"
    src_file="$state/$(key "$src")"
    [ -f "$src_file" ] || exit 1
    cp "$src_file" "$state/$(key "$dst")"
    ;;
  *)
    echo "Unsupported fake docker call: $*" >&2
    exit 2
    ;;
esac
SH
chmod +x "$TMP_DIR/bin/docker"

printf 'sha256:frontend\n' >"$TMP_DIR/docker-state/parsevk-frontend_latest"
printf 'sha256:gateway\n' >"$TMP_DIR/docker-state/parsevk-api-gateway_latest"

export PATH="$TMP_DIR/bin:$PATH"
export FAKE_DOCKER_STATE="$TMP_DIR/docker-state"
export PROJECT_ROOT="$TMP_DIR/project"
export SERVICE_CATALOG_CLI="$TMP_DIR/project/.github/scripts/service_catalog.py"
export RELEASES_DIR="$TMP_DIR/project/.releases"
export DEPLOYMENT_METADATA_FILE="$TMP_DIR/project/.deployment-metadata.json"

commit="1234567890abcdef1234567890abcdef12345678"
bash "$SCRIPT" snapshot "$commit"
manifest="$RELEASES_DIR/$commit/release.json"
[ "$(jq -r '.status' "$manifest")" = "candidate" ]
[ "$(jq '.images | length' "$manifest")" -eq 2 ]

bash "$SCRIPT" promote "$commit"
[ "$(jq -r '.status' "$manifest")" = "successful" ]

printf 'sha256:other-frontend\n' >"$TMP_DIR/docker-state/parsevk-frontend_latest"
printf 'sha256:other-gateway\n' >"$TMP_DIR/docker-state/parsevk-api-gateway_latest"
bash "$SCRIPT" activate "$commit"

grep -qx 'sha256:frontend' "$TMP_DIR/docker-state/parsevk-frontend_latest"
grep -qx 'sha256:gateway' "$TMP_DIR/docker-state/parsevk-api-gateway_latest"

jq -n --arg current "$commit" \
  '{last_successful_commit:$current, previous_successful_commit:""}' \
  >"$DEPLOYMENT_METADATA_FILE"
export RELEASE_RETENTION=1

commit_two="2234567890abcdef1234567890abcdef12345678"
printf 'sha256:frontend-two\n' >"$TMP_DIR/docker-state/parsevk-frontend_latest"
printf 'sha256:gateway-two\n' >"$TMP_DIR/docker-state/parsevk-api-gateway_latest"
bash "$SCRIPT" snapshot "$commit_two"
bash "$SCRIPT" promote "$commit_two"

commit_three="3234567890abcdef1234567890abcdef12345678"
printf 'sha256:frontend-three\n' >"$TMP_DIR/docker-state/parsevk-frontend_latest"
printf 'sha256:gateway-three\n' >"$TMP_DIR/docker-state/parsevk-api-gateway_latest"
bash "$SCRIPT" snapshot "$commit_three"
bash "$SCRIPT" promote "$commit_three"

[ -f "$RELEASES_DIR/$commit/release.json" ]
[ ! -e "$RELEASES_DIR/$commit_two" ]
[ -f "$RELEASES_DIR/$commit_three/release.json" ]

export FAILED_RELEASE_RETENTION=1
failed_one="4234567890abcdef1234567890abcdef12345678"
printf 'sha256:failed-one-frontend\n' >"$TMP_DIR/docker-state/parsevk-frontend_latest"
printf 'sha256:failed-one-gateway\n' >"$TMP_DIR/docker-state/parsevk-api-gateway_latest"
bash "$SCRIPT" snapshot "$failed_one"
bash "$SCRIPT" mark-failed "$failed_one"
failed_one_manifest="$RELEASES_DIR/$failed_one/release.json"
[ -f "$failed_one_manifest" ]
[ "$(jq -r '.status' "$failed_one_manifest")" = "failed" ]
[ -n "$(jq -r '.failed_at // empty' "$failed_one_manifest")" ]
[ -e "$TMP_DIR/docker-state/parsevk-release_frontend_sha-$failed_one" ]
[ -e "$TMP_DIR/docker-state/parsevk-release_api-gateway_sha-$failed_one" ]

sleep 1
failed_two="5234567890abcdef1234567890abcdef12345678"
printf 'sha256:failed-two-frontend\n' >"$TMP_DIR/docker-state/parsevk-frontend_latest"
printf 'sha256:failed-two-gateway\n' >"$TMP_DIR/docker-state/parsevk-api-gateway_latest"
bash "$SCRIPT" snapshot "$failed_two"
bash "$SCRIPT" mark-failed "$failed_two"
failed_two_manifest="$RELEASES_DIR/$failed_two/release.json"

[ ! -e "$RELEASES_DIR/$failed_one" ]
[ ! -e "$TMP_DIR/docker-state/parsevk-release_frontend_sha-$failed_one" ]
[ ! -e "$TMP_DIR/docker-state/parsevk-release_api-gateway_sha-$failed_one" ]
[ -f "$failed_two_manifest" ]
[ "$(jq -r '.status' "$failed_two_manifest")" = "failed" ]
[ -e "$TMP_DIR/docker-state/parsevk-release_frontend_sha-$failed_two" ]
[ -e "$TMP_DIR/docker-state/parsevk-release_api-gateway_sha-$failed_two" ]

bash "$SCRIPT" purge "$failed_two"
[ ! -e "$RELEASES_DIR/$failed_two" ]
[ ! -e "$TMP_DIR/docker-state/parsevk-release_frontend_sha-$failed_two" ]
[ ! -e "$TMP_DIR/docker-state/parsevk-release_api-gateway_sha-$failed_two" ]

if bash "$SCRIPT" mark-failed "$commit_three" >/dev/null 2>&1; then
  echo "Successful release was incorrectly marked failed"
  exit 1
fi
if bash "$SCRIPT" purge "$commit_three" >/dev/null 2>&1; then
  echo "Successful release was incorrectly purged"
  exit 1
fi

[ -f "$RELEASES_DIR/$commit_three/release.json" ]
echo "Local immutable release lifecycle, protected retention and bounded failed-candidate recovery are valid"
