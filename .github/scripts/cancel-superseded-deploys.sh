#!/usr/bin/env bash
set -euo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${RELEASE_SHA:?RELEASE_SHA is required}"

GH_BIN="${GH_BIN:-gh}"
DEPLOY_WORKFLOW="${DEPLOY_WORKFLOW:-deploy.yml}"
POLL_ATTEMPTS="${POLL_ATTEMPTS:-20}"
POLL_INTERVAL="${POLL_INTERVAL:-2}"

api() {
  "$GH_BIN" api "$@"
}

is_cancellable_status() {
  case "$1" in
    queued|pending|waiting|requested) return 0 ;;
    *) return 1 ;;
  esac
}

RUN_PAGES="$(api --paginate --slurp --method GET \
  "repos/${GITHUB_REPOSITORY}/actions/workflows/${DEPLOY_WORKFLOW}/runs" \
  -f event=workflow_dispatch \
  -f branch=main \
  -f per_page=100)"

mapfile -t CANDIDATES < <(
  jq -r --arg release_sha "$RELEASE_SHA" '
    [.[].workflow_runs[]]
    | .[]
    | . as $run
    | (
        if (($run.display_title // "") | test("^Deploy release [0-9a-f]{40}$")) then
          (($run.display_title | capture("^Deploy release (?<sha>[0-9a-f]{40})$")).sha)
        elif (
          (($run.head_commit.message // "") | startswith("chore(release):")) and
          (($run.head_commit.message // "") | contains("[skip ci]"))
        ) then
          $run.head_sha
        else
          null
        end
      ) as $run_release_sha
    | select($run_release_sha != null)
    | select($run_release_sha != $release_sha)
    | select(
        $run.status == "queued" or
        $run.status == "pending" or
        $run.status == "waiting" or
        $run.status == "requested"
      )
    | $run.id
  ' <<<"$RUN_PAGES"
)

if (( ${#CANDIDATES[@]} == 0 )); then
  echo "No superseded queued production deploy runs found."
  exit 0
fi

for run_id in "${CANDIDATES[@]}"; do
  RUN="$(api --method GET "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}")"
  STATUS="$(jq -r '.status' <<<"$RUN")"
  is_cancellable_status "$STATUS" || {
    echo "::error::Superseded production deploy ${run_id} changed to ${STATUS}; refusing to cancel it."
    exit 1
  }

  JOBS="$(api --method GET \
    "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}/jobs" \
    -f filter=latest \
    -f per_page=100)"
  ACTIVE_JOBS="$(jq '[.jobs[] | select(.status == "in_progress")] | length' <<<"$JOBS")"
  if (( ACTIVE_JOBS > 0 )); then
    echo "::error::Superseded production deploy ${run_id} has an active job; refusing to cancel it."
    exit 1
  fi

  RUN="$(api --method GET "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}")"
  STATUS="$(jq -r '.status' <<<"$RUN")"
  is_cancellable_status "$STATUS" || {
    echo "::error::Superseded production deploy ${run_id} changed to ${STATUS} before cancellation."
    exit 1
  }

  echo "Cancelling superseded queued production deploy ${run_id}."
  if ! api --method POST \
    "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}/cancel" >/dev/null; then
    RUN="$(api --method GET "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}")"
    STATUS="$(jq -r '.status' <<<"$RUN")"
    [[ "$STATUS" == "completed" ]] || {
      echo "::error::Failed to cancel superseded production deploy ${run_id}; status=${STATUS}"
      exit 1
    }
  fi
done

for run_id in "${CANDIDATES[@]}"; do
  settled=false
  for _ in $(seq 1 "$POLL_ATTEMPTS"); do
    RUN="$(api --method GET "repos/${GITHUB_REPOSITORY}/actions/runs/${run_id}")"
    STATUS="$(jq -r '.status' <<<"$RUN")"
    CONCLUSION="$(jq -r '.conclusion // ""' <<<"$RUN")"
    echo "Superseded deploy ${run_id}: status=${STATUS} conclusion=${CONCLUSION:-null}"
    if [[ "$STATUS" == "completed" ]]; then
      settled=true
      break
    fi
    sleep "$POLL_INTERVAL"
  done

  [[ "$settled" == "true" ]] || {
    echo "::error::Timed out waiting for superseded production deploy ${run_id} to cancel."
    exit 1
  }
done

printf 'Cancelled %d superseded queued production deploy run(s).\n' "${#CANDIDATES[@]}"
