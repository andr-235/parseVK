#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_WORKFLOW="$ROOT_DIR/.github/workflows/deploy.yml"
ROLLBACK_WORKFLOW="$ROOT_DIR/.github/workflows/rollback.yml"

if [ ! -f "$DEPLOY_WORKFLOW" ]; then
  echo "Deploy workflow not found: $DEPLOY_WORKFLOW"
  exit 1
fi

if [ ! -f "$ROLLBACK_WORKFLOW" ]; then
  echo "Rollback workflow not found: $ROLLBACK_WORKFLOW"
  exit 1
fi

if rg -n 'docker compose .* run .*--no-build' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: deploy workflow uses unsupported --no-build flag with docker compose run"
  rg -n 'docker compose .* run .*--no-build' "$DEPLOY_WORKFLOW"
  exit 1
fi

for script in \
  "$ROOT_DIR/.github/scripts/production/common.sh" \
  "$ROOT_DIR/.github/scripts/production/metadata.sh" \
  "$ROOT_DIR/.github/scripts/production/preflight.sh" \
  "$ROOT_DIR/.github/scripts/production/images.sh" \
  "$ROOT_DIR/.github/scripts/production/migrations.sh" \
  "$ROOT_DIR/.github/scripts/production/release.sh"
do
  if [ ! -f "$script" ]; then
    echo "Missing production helper script: $script"
    exit 1
  fi
done

if ! rg -n 'PRODUCTION_SCRIPTS_DIR/preflight\.sh|preflight\.sh' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows do not call shared production preflight"
  exit 1
fi

if ! rg -n 'PRODUCTION_SCRIPTS_DIR/release\.sh|release\.sh' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows do not call shared production release helper"
  exit 1
fi

if ! rg -n 'PRODUCTION_SCRIPTS_DIR/metadata\.sh|metadata\.sh' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows do not call shared production metadata helper"
  exit 1
fi

if rg -n 'jq --arg commit .*last_successful_commit' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows still mutate deployment metadata inline"
  rg -n 'jq --arg commit .*last_successful_commit' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW"
  exit 1
fi

if rg -n 'docker compose -f "\$COMPOSE_FILE" build --progress plain' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows still perform inline docker compose build"
  rg -n 'docker compose -f "\$COMPOSE_FILE" build --progress plain' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW"
  exit 1
fi

if rg -n 'docker compose -f "\$COMPOSE_FILE" up ' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows still perform inline docker compose up"
  rg -n 'docker compose -f "\$COMPOSE_FILE" up ' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW"
  exit 1
fi

if rg -n 'images\.sh" prepare .*prometheus|images\.sh" prepare .*node-exporter|images\.sh" prepare .*grafana' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: deploy workflow eagerly prepares monitoring images"
  rg -n 'images\.sh" prepare .*prometheus|images\.sh" prepare .*node-exporter|images\.sh" prepare .*grafana' "$DEPLOY_WORKFLOW"
  exit 1
fi

if rg -n 'images\.sh" prepare .*prometheus|images\.sh" prepare .*node-exporter|images\.sh" prepare .*grafana' "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: rollback workflow eagerly prepares monitoring images"
  rg -n 'images\.sh" prepare .*prometheus|images\.sh" prepare .*node-exporter|images\.sh" prepare .*grafana' "$ROLLBACK_WORKFLOW"
  exit 1
fi

echo "Production workflows use the shared production shell layer"
