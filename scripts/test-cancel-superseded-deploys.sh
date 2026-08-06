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
PAGINATE=false
SLURP=false
while (( $# > 0 )); do
  case "$1" in
    api) shift ;;
    --method) METHOD="$2"; shift 2 ;;
    --paginate) PAGINATE=true; shift ;;
    --slurp) SLURP=true; shift ;;
    -f) shift 2 ;;
    *) PATH_VALUE="$1"; shift ;;
  esac
done

CURRENT_SHA="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
OLD_SHA="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
LEGACY_SHA="cccccccccccccccccccccccccccccccccccccccc"

case "$PATH_VALUE" in
  */actions/workflows/deploy.yml/runs)
    [[ "$PAGINATE" == true && "$SLURP" == true ]] || {
      echo "Deploy runs were not requested with pagination and slurp" >&2
      exit 4
    }
    cat <<JSON
[
  {"workflow_runs":[
    {"id":102,"display_title":"Deploy release ${CURRENT_SHA}","head_sha":"main-tip","head_commit":{"message":"normal main commit"},"status":"pending"},
    {"id":103,"display_title":"Deploy release ${OLD_SHA}","head_sha":"main-tip","head_commit":{"message":"normal main commit"},"status":"completed"},
    {"id":105,"display_title":"Deploy to Production Server","head_sha":"${OLD_SHA}","head_commit":{"message":"normal main commit"},"status":"queued"}
  ]},
  {"workflow_runs":[
    {"id":101,"display_title":"Deploy release ${OLD_SHA}","head_sha":"later-main-tip","head_commit":{"message":"normal main commit"},"status":"in_progress"},
    {"id":104,"display_title":"Deploy to Production Server","head_sha":"${LEGACY_SHA}","head_commit":{"message":"chore(release): 0.91.5 [skip ci]"},"status":"waiting"}
  ]}
]
JSON
    ;;
  */actions/runs/*/jobs)
    run_id="$(sed -E 's#^.*/actions/runs/([0-9]+)/jobs$#\1#' <<<"$PATH_VALUE")"
    if [[ "${GH_SCENARIO:-safe}" == "active" && "$run_id" == "101" ]]; then
      printf '%s\n' '{"jobs":[{"name":"Verify Release Gates","status":"completed"},{"name":"Deploy to Debian Server","status":"in_progress"}]}'
    elif [[ "${GH_SCENARIO:-safe}" == "started-before-cancel" && "$run_id" == "101" ]]; then
      previous_calls="$(grep -cx 'jobs:101' "$GH_CALLS_FILE" 2>/dev/null || true)"
      printf 'jobs:101\n' >> "$GH_CALLS_FILE"
      if (( previous_calls > 0 )); then
        printf '%s\n' '{"jobs":[{"name":"Verify Release Gates","status":"completed"},{"name":"Deploy to Debian Server","status":"in_progress"}]}'
      else
        printf '%s\n' '{"jobs":[{"name":"Verify Release Gates","status":"completed"},{"name":"Deploy to Debian Server","status":"queued"}]}'
      fi
    else
      printf '%s\n' '{"jobs":[{"name":"Verify Release Gates","status":"completed"},{"name":"Deploy to Debian Server","status":"queued"}]}'
    fi
    ;;
  */actions/runs/*/cancel)
    [[ "$METHOD" == "POST" ]] || exit 2
    run_id="$(sed -E 's#^.*/actions/runs/([0-9]+)/cancel$#\1#' <<<"$PATH_VALUE")"
    printf '%s\n' "$run_id" >> "$GH_STATE_FILE"
    ;;
  */actions/runs/*)
    run_id="$(sed -E 's#^.*/actions/runs/([0-9]+)$#\1#' <<<"$PATH_VALUE")"
    if grep -qx "$run_id" "$GH_STATE_FILE" 2>/dev/null; then
      printf '%s\n' '{"status":"completed","conclusion":"cancelled"}'
    elif [[ "$run_id" == "101" ]]; then
      printf '%s\n' '{"status":"in_progress","conclusion":null}'
    elif [[ "$run_id" == "104" ]]; then
      printf '%s\n' '{"status":"waiting","conclusion":null}'
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
CALLS_FILE="$TMP_DIR/calls"
CURRENT_SHA="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

run_cleanup() {
  local scenario="$1" attempts="$2"
  GITHUB_REPOSITORY=andr-235/parseVK \
  RELEASE_SHA="$CURRENT_SHA" \
  GH_BIN="$TMP_DIR/gh" \
  GH_STATE_FILE="$STATE_FILE" \
  GH_CALLS_FILE="$CALLS_FILE" \
  GH_SCENARIO="$scenario" \
  POLL_ATTEMPTS="$attempts" \
  POLL_INTERVAL=0 \
    bash "$SCRIPT"
}

: > "$STATE_FILE"
: > "$CALLS_FILE"
run_cleanup safe 2

[[ "$(sort -n "$STATE_FILE" | tr '\n' ' ')" == "101 104 " ]] || {
  echo "Expected in-progress run with queued deploy job and legacy waiting run to be cancelled"
  cat "$STATE_FILE"
  exit 1
}

: > "$STATE_FILE"
: > "$CALLS_FILE"
if run_cleanup active 1; then
  echo "Run with an active production job was cancelled"
  exit 1
fi

[[ ! -s "$STATE_FILE" ]] || {
  echo "Cancellation was attempted for an active production job"
  exit 1
}

: > "$STATE_FILE"
: > "$CALLS_FILE"
if run_cleanup started-before-cancel 1; then
  echo "Deployment that started between safety checks was cancelled"
  exit 1
fi

[[ ! -s "$STATE_FILE" ]] || {
  echo "Cancellation was attempted after the deploy job changed to in_progress"
  exit 1
}

[[ "$(grep -cx 'jobs:101' "$CALLS_FILE" 2>/dev/null || true)" == "2" ]] || {
  echo "Expected two independent job safety checks before cancellation"
  cat "$CALLS_FILE"
  exit 1
}

echo "Deploy cleanup handles in-progress runs and fences newly-started production jobs"
