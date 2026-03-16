#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_WORKFLOW="$ROOT_DIR/.github/workflows/deploy.yml"

if [ ! -f "$DEPLOY_WORKFLOW" ]; then
  echo "Deploy workflow not found: $DEPLOY_WORKFLOW"
  exit 1
fi

if rg -n 'docker compose .* run .*--no-build' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: deploy workflow uses unsupported --no-build flag with docker compose run"
  rg -n 'docker compose .* run .*--no-build' "$DEPLOY_WORKFLOW"
  exit 1
fi

echo "Deploy workflow migration command is compatible with docker compose run"
