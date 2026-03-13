#!/usr/bin/env bash
set -euo pipefail

# docs-only -> skip
# api-only -> run backend
# front-only -> run frontend
# shared config -> run both

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DRY_RUN="${PRE_PUSH_DRY_RUN:-0}"
backend_changed=false
frontend_changed=false
non_docs_changed=false

UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"
if [ -n "$UPSTREAM" ]; then
  BASE_REF="$UPSTREAM"
else
  BASE_REF="$(git merge-base HEAD main 2>/dev/null || git rev-parse HEAD^ 2>/dev/null || true)"
fi

if [ -z "${BASE_REF:-}" ]; then
  echo "Could not determine base revision for pre-push checks"
  exit 1
fi

CHANGED_FILES="$(
  {
    git diff --name-only "${BASE_REF}"...HEAD
    git diff --name-only
    git diff --name-only --cached
  } | awk 'NF' | sort -u
)"

if [ -z "$CHANGED_FILES" ]; then
  echo "No changes detected for pre-push checks"
  exit 0
fi

while IFS= read -r file; do
  [ -z "$file" ] && continue

  case "$file" in
    api/*|create-session.js)
      backend_changed=true
      non_docs_changed=true
      ;;
    front/*)
      frontend_changed=true
      non_docs_changed=true
      ;;
    .github/workflows/ci.yml|.husky/*|.lintstagedrc.js|package.json|bun.lock|api/bun.lock|front/bun.lock|scripts/*)
      backend_changed=true
      frontend_changed=true
      non_docs_changed=true
      ;;
    docs/*|*.md)
      ;;
    *)
      backend_changed=true
      frontend_changed=true
      non_docs_changed=true
      ;;
  esac
done <<< "$CHANGED_FILES"

if [ "$non_docs_changed" = false ]; then
  echo "Docs-only change, skipping"
  exit 0
fi

run_backend() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "Would run backend checks"
    return
  fi

  echo "Running backend pre-push checks"
  (
    cd api
    bun run check:push
  )
}

run_frontend() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "Would run frontend checks"
    return
  fi

  echo "Running frontend pre-push checks"
  (
    cd front
    bun run check:push
  )
}

if [ "$backend_changed" = true ]; then
  run_backend
fi

if [ "$frontend_changed" = true ]; then
  run_frontend
fi
