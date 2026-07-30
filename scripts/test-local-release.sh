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

echo "Local immutable release lifecycle and protected retention are valid"
