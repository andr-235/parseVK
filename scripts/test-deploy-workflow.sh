#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_WORKFLOW="$ROOT_DIR/.github/workflows/deploy.yml"
ROLLBACK_WORKFLOW="$ROOT_DIR/.github/workflows/rollback.yml"
CI_WORKFLOW="$ROOT_DIR/.github/workflows/ci.yml"
SECURITY_WORKFLOW="$ROOT_DIR/.github/workflows/security.yml"

for workflow in "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" "$CI_WORKFLOW" "$SECURITY_WORKFLOW"; do
  if [ ! -f "$workflow" ]; then
    echo "Workflow not found: $workflow"
    exit 1
  fi
done

if grep -En 'steps\.detect\.outputs\.(frontend_changed|python_changed)' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: CI outputs reference the non-existent steps.detect id"
  grep -En 'steps\.detect\.outputs\.(frontend_changed|python_changed)' "$CI_WORKFLOW"
  exit 1
fi

if ! grep -En 'steps\.filter\.outputs\.frontend_changed' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'steps\.filter\.outputs\.python_changed' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: CI change outputs are not wired to steps.filter"
  exit 1
fi

if ! grep -En 'name: Release Gate' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: CI does not expose a stable Release Gate"
  exit 1
fi

if ! grep -En 'name: Validate Production Release' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: CI does not validate production release configuration"
  exit 1
fi

if ! grep -En 'name: Security Gate' "$SECURITY_WORKFLOW" >/dev/null; then
  echo "Regression: Security Scanning does not expose a stable Security Gate"
  exit 1
fi

if ! grep -En 'REQUIRED_WORKFLOWS=\("CI" "Security Scanning"\)' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: deploy does not wait for both CI and Security Scanning"
  exit 1
fi

if ! grep -En 'needs: gate' "$DEPLOY_WORKFLOW" >/dev/null || \
   ! grep -En "needs\.gate\.outputs\.deploy == 'true'" "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: production deploy is not gated by the release verifier"
  exit 1
fi

if ! grep -En 'Verify container health' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: deploy does not require post-release health verification"
  exit 1
fi

health_line="$(grep -En 'Verify container health' "$DEPLOY_WORKFLOW" | head -n1 | cut -d: -f1)"
metadata_line="$(grep -En 'Update deployment metadata' "$DEPLOY_WORKFLOW" | head -n1 | cut -d: -f1)"
if [ -z "$health_line" ] || [ -z "$metadata_line" ] || (( health_line >= metadata_line )); then
  echo "Regression: deployment metadata can be written before health verification"
  exit 1
fi

if grep -En 'docker compose .* run .*--no-build' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: deploy workflow uses unsupported --no-build flag with docker compose run"
  grep -En 'docker compose .* run .*--no-build' "$DEPLOY_WORKFLOW"
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

if ! grep -En 'PRODUCTION_SCRIPTS_DIR/preflight\.sh|preflight\.sh' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows do not call shared production preflight"
  exit 1
fi

if ! grep -En 'PRODUCTION_SCRIPTS_DIR/release\.sh|release\.sh' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows do not call shared production release helper"
  exit 1
fi

if ! grep -En 'PRODUCTION_SCRIPTS_DIR/metadata\.sh|metadata\.sh' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows do not call shared production metadata helper"
  exit 1
fi

if grep -En 'jq --arg commit .*last_successful_commit' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows still mutate deployment metadata inline"
  grep -En 'jq --arg commit .*last_successful_commit' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW"
  exit 1
fi

if grep -En 'docker compose -f "\$COMPOSE_FILE" build --progress plain' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows still perform inline docker compose build"
  grep -En 'docker compose -f "\$COMPOSE_FILE" build --progress plain' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW"
  exit 1
fi

if grep -En 'docker compose -f "\$COMPOSE_FILE" up ' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows still perform inline docker compose up"
  grep -En 'docker compose -f "\$COMPOSE_FILE" up ' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW"
  exit 1
fi

if grep -En 'images\.sh" prepare .*prometheus|images\.sh" prepare .*node-exporter|images\.sh" prepare .*grafana' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: production workflows eagerly prepare monitoring images"
  exit 1
fi

echo "Production workflows are gated by CI, security, static validation and health checks"
