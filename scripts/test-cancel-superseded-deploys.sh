#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/.github/scripts/cancel-superseded-deploys.sh"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

[[ -f "$SCRIPT" ]] || { echo "Cancellation script not found"; exit 1; }

cat > "$TMP_DIR/gh" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail

METHOD=GET
PATH_VALUE=""
while (( $# > 0 )); do
  case "$1" in
    api) shift ;;
    --method) METHOD="$2"; shift 2 ;;
    -f) shift 2 ;;
    *) PATH_VALUE="$1"; shift ;;
  esac
done

case "$PATH_VALUE" in
  */actions/workflows/deploy.yml/runs)
    cat <<JSON
{"workflow_runs":[
  {"id":101,"head_sha":"old-release","status":"queued"},
  {"id":102,"head_sha":"current-release","status":"pending"},
  {"id":103,"head_sha":"older-complete","status":"completed"}
]}
JSON
    ;;
  */actions/runs/101/jobs)
    if [[ "${GH_SCENARIO:-safe}" == "active" ]]; then
      printf '%s\n' '{"jobs":[{"status":"in_progress"}]}'
    else
      printf '%s\n' '{"jobs":[{"status":"completed"},{"status":"queued"}]}'
    fi
    ;;
  */actions/runs/101/cancel)
    [[ "$METHOD" == "POST" ]] || exit 2
    printf '101\n' >> "$GH_STATE_FILE"
    ;;
  */actions/runs/101)
    if grep -qx '101' "$GH_STATE_FILE" 2>/dev/null; then
      printf '%s\n' '{"status":"completed","conclusion":"cancelled"}'
    else
      printf '%s\n' '{"status":"queued","conclusion":null}'
    fi
    ;;
  *)
    echo "Unexpected API path: $PATH_VALUE" >&2
    exit 3
    ;;
esac
STUB
chmod +x "$TMP_DIR/gh"

STATE_FILE="$TMP_DIR/state"
: > "$STATE_FILE"
GITHUB_REPOSITORY=andr-235/parseVK \
RELEASE_SHA=current-release \
GH_BIN="$TMP_DIR/gh" \
GH_STATE_FILE="$STATE_FILE" \
POLL_ATTEMPTS=2 \
POLL_INTERVAL=0 \
  bash "$SCRIPT"

grep -qx '101' "$STATE_FILE" || {
  echo "Queued superseded deployment was not cancelled"
  exit 1
}

: > "$STATE_FILE"
if GITHUB_REPOSITORY=andr-235/parseVK \
  RELEASE_SHA=current-release \
  GH_BIN="$TMP_DIR/gh" \
  GH_STATE_FILE="$STATE_FILE" \
  GH_SCENARIO=active \
  POLL_ATTEMPTS=1 \
  POLL_INTERVAL=0 \
    bash "$SCRIPT"; then
  echo "Active superseded deployment was cancelled"
  exit 1
fi

[[ ! -s "$STATE_FILE" ]] || {
  echo "Cancellation was attempted for an active deployment"
  exit 1
}

echo "Superseded deployment cancellation is safe and deterministic"
