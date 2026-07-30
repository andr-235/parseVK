#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_WORKFLOW="$ROOT_DIR/.github/workflows/deploy.yml"
ROLLBACK_WORKFLOW="$ROOT_DIR/.github/workflows/rollback.yml"
CI_WORKFLOW="$ROOT_DIR/.github/workflows/ci.yml"
SECURITY_WORKFLOW="$ROOT_DIR/.github/workflows/security.yml"
PYTHON_QUALITY_WORKFLOW="$ROOT_DIR/.github/workflows/reusable-python-quality.yml"
PYTHON_SECURITY_WORKFLOW="$ROOT_DIR/.github/workflows/reusable-python-security.yml"
DOCKER_SECURITY_WORKFLOW="$ROOT_DIR/.github/workflows/reusable-docker-security.yml"
ALEMBIC_WORKFLOW="$ROOT_DIR/.github/workflows/reusable-alembic-migration.yml"
SERVICE_CATALOG="$ROOT_DIR/.github/service-catalog.yaml"
SERVICE_CATALOG_CLI="$ROOT_DIR/.github/scripts/service_catalog.py"
ALEMBIC_VALIDATOR="$ROOT_DIR/.github/scripts/validate_alembic_graphs.py"
IMAGES_SCRIPT="$ROOT_DIR/.github/scripts/production/images.sh"

for file in \
  "$DEPLOY_WORKFLOW" \
  "$ROLLBACK_WORKFLOW" \
  "$CI_WORKFLOW" \
  "$SECURITY_WORKFLOW" \
  "$PYTHON_QUALITY_WORKFLOW" \
  "$PYTHON_SECURITY_WORKFLOW" \
  "$DOCKER_SECURITY_WORKFLOW" \
  "$ALEMBIC_WORKFLOW" \
  "$SERVICE_CATALOG" \
  "$SERVICE_CATALOG_CLI" \
  "$ALEMBIC_VALIDATOR"
do
  if [ ! -f "$file" ]; then
    echo "Required CI/CD file not found: $file"
    exit 1
  fi
done

for workflow in \
  "$PYTHON_QUALITY_WORKFLOW" \
  "$PYTHON_SECURITY_WORKFLOW" \
  "$DOCKER_SECURITY_WORKFLOW" \
  "$ALEMBIC_WORKFLOW"
do
  if ! grep -En 'workflow_call:' "$workflow" >/dev/null; then
    echo "Regression: reusable workflow does not declare workflow_call: $workflow"
    exit 1
  fi
done

if grep -En 'steps\.detect\.outputs\.(frontend_changed|python_changed)' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: CI outputs reference the non-existent steps.detect id"
  exit 1
fi

if ! grep -En 'steps\.filter\.outputs\.frontend_changed' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'steps\.filter\.outputs\.python_changed' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: CI change outputs are not wired to steps.filter"
  exit 1
fi

if ! grep -En 'service_matrix:.*steps\.services\.outputs\.value' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'fromJSON\(needs\.changes\.outputs\.service_matrix\)' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'uses: \./\.github/workflows/reusable-python-quality\.yml' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: Python service tests are not generated from the catalog and reusable workflow"
  exit 1
fi

if grep -En 'working-directory: services/\$\{\{ matrix\.service \}\}' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: inline Python service quality steps returned to CI"
  exit 1
fi

if ! grep -En 'migration_matrix:.*steps\.migrations\.outputs\.value' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'migrations_changed:.*steps\.migrations\.outputs\.changed' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En -- '--purpose migration' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'fromJSON\(needs\.changes\.outputs\.migration_matrix\)' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'uses: \./\.github/workflows/reusable-alembic-migration\.yml' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'database_url_env:.*matrix\.database_url_env' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: executable migration matrix is not wired through the catalog"
  exit 1
fi

if ! grep -En 'migration-services' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'MIGRATIONS_CHANGED:.*needs\.changes\.outputs\.migrations_changed' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'MIGRATION_SERVICES_RESULT:.*needs\.migration-services\.result' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'require_conditional "Execute Alembic migrations"' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: Release Gate does not enforce executable migrations"
  exit 1
fi

if ! grep -En 'name: Validate Service Catalog' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'service_catalog\.py validate' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'test_validate_alembic_graphs\.py' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: CI does not validate catalog and Alembic contracts"
  exit 1
fi

if ! grep -En 'uv sync --extra test --frozen' "$PYTHON_QUALITY_WORKFLOW" >/dev/null || \
   ! grep -En 'uv run pytest -v' "$PYTHON_QUALITY_WORKFLOW" >/dev/null; then
  echo "Regression: reusable Python quality workflow does not execute frozen tests"
  exit 1
fi

if ! grep -En 'audit_matrix:.*steps\.audit\.outputs\.value' "$SECURITY_WORKFLOW" >/dev/null || \
   ! grep -En 'docker_matrix:.*steps\.docker\.outputs\.value' "$SECURITY_WORKFLOW" >/dev/null || \
   ! grep -En 'fromJSON\(needs\.catalog\.outputs\.audit_matrix\)' "$SECURITY_WORKFLOW" >/dev/null || \
   ! grep -En 'fromJSON\(needs\.catalog\.outputs\.docker_matrix\)' "$SECURITY_WORKFLOW" >/dev/null || \
   ! grep -En 'uses: \./\.github/workflows/reusable-python-security\.yml' "$SECURITY_WORKFLOW" >/dev/null || \
   ! grep -En 'uses: \./\.github/workflows/reusable-docker-security\.yml' "$SECURITY_WORKFLOW" >/dev/null; then
  echo "Regression: Security matrices do not call reusable workflows"
  exit 1
fi

if grep -En 'working-directory: services/\$\{\{ matrix\.service \}\}' "$SECURITY_WORKFLOW" >/dev/null || \
   grep -En 'aquasecurity/trivy-action' "$SECURITY_WORKFLOW" >/dev/null; then
  echo "Regression: inline service security implementation returned to Security Scanning"
  exit 1
fi

if ! grep -En 'uv audit --frozen --no-dev' "$PYTHON_SECURITY_WORKFLOW" >/dev/null || \
   ! grep -En 'aquasecurity/trivy-action@v0\.36\.0' "$DOCKER_SECURITY_WORKFLOW" >/dev/null || \
   ! grep -En 'github/codeql-action/upload-sarif@v4' "$DOCKER_SECURITY_WORKFLOW" >/dev/null; then
  echo "Regression: reusable security workflows lost dependency or image scanning"
  exit 1
fi

if ! grep -En 'image: postgres:16\.14' "$ALEMBIC_WORKFLOW" >/dev/null || \
   ! grep -En 'validate_alembic_graphs\.py --service' "$ALEMBIC_WORKFLOW" >/dev/null || \
   ! grep -En 'uv run alembic upgrade head' "$ALEMBIC_WORKFLOW" >/dev/null || \
   ! grep -En 'uv run alembic current --verbose' "$ALEMBIC_WORKFLOW" >/dev/null; then
  echo "Regression: reusable Alembic workflow does not execute migrations on PostgreSQL"
  exit 1
fi

if ! grep -En 'name: Release Gate' "$CI_WORKFLOW" >/dev/null || \
   ! grep -En 'name: Validate Production Release' "$CI_WORKFLOW" >/dev/null; then
  echo "Regression: CI release gates are missing"
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

if ! grep -En 'description: "Повторно развернуть текущий проверенный commit ветки main"' "$DEPLOY_WORKFLOW" >/dev/null || \
   ! grep -En 'MANUAL_REF.*github\.ref' "$DEPLOY_WORKFLOW" >/dev/null || \
   ! grep -En 'MANUAL_SHA.*github\.sha' "$DEPLOY_WORKFLOW" >/dev/null || \
   ! grep -En 'MANUAL_REF.*refs/heads/main|\$MANUAL_REF.*refs/heads/main' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: manual production deploy is not explicitly restricted to current main"
  exit 1
fi

if grep -En 'workflow_dispatch\.inputs.*ref|inputs\.ref|MANUAL_REF_NAME|TARGET_REF' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: manual production deploy accepts an arbitrary branch or ref"
  exit 1
fi

if ! grep -En 'needs: gate' "$DEPLOY_WORKFLOW" >/dev/null || \
   ! grep -En "needs\.gate\.outputs\.deploy == 'true'" "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: production deploy is not gated by the release verifier"
  exit 1
fi

if ! grep -En 'service_catalog\.py|SERVICE_CATALOG_CLI' "$DEPLOY_WORKFLOW" >/dev/null || \
   ! grep -En -- '--purpose deploy' "$DEPLOY_WORKFLOW" >/dev/null || \
   ! grep -En 'SERVICES_TO_BUILD:.*steps\.changed_services\.outputs\.value' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: production build targets are not resolved through the service catalog"
  exit 1
fi

if grep -En 'BUILD_(FRONTEND|API_GATEWAY|IDENTITY_SERVICE|TASKS_SERVICE|VK_SERVICE|CONTENT_SERVICE|LISTINGS_SERVICE|MODERATION_SERVICE|REALTIME_SERVICE|TELEGRAM_SERVICE|IM_SERVICE)' "$DEPLOY_WORKFLOW" >/dev/null; then
  echo "Regression: deploy restored hard-coded per-service build flags"
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

for script in \
  "$ROOT_DIR/.github/scripts/production/common.sh" \
  "$ROOT_DIR/.github/scripts/production/metadata.sh" \
  "$ROOT_DIR/.github/scripts/production/preflight.sh" \
  "$IMAGES_SCRIPT" \
  "$ROOT_DIR/.github/scripts/production/migrations.sh" \
  "$ROOT_DIR/.github/scripts/production/release.sh"
do
  if [ ! -f "$script" ]; then
    echo "Missing production helper script: $script"
    exit 1
  fi
done

if ! grep -En 'PRODUCTION_SCRIPTS_DIR/preflight\.sh|preflight\.sh' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null || \
   ! grep -En 'PRODUCTION_SCRIPTS_DIR/release\.sh|release\.sh' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null || \
   ! grep -En 'PRODUCTION_SCRIPTS_DIR/metadata\.sh|metadata\.sh' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: workflows do not call shared production helpers"
  exit 1
fi

if grep -En 'jq --arg commit .*last_successful_commit' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null || \
   grep -En 'docker compose -f "\$COMPOSE_FILE" build --progress plain' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null || \
   grep -En 'docker compose -f "\$COMPOSE_FILE" up ' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: production lifecycle logic leaked back into workflow YAML"
  exit 1
fi

if grep -En 'images\.sh" prepare .*prometheus|images\.sh" prepare .*node-exporter|images\.sh" prepare .*grafana' "$DEPLOY_WORKFLOW" "$ROLLBACK_WORKFLOW" >/dev/null; then
  echo "Regression: production workflows eagerly prepare monitoring images"
  exit 1
fi

missing_catalog_output=""
if missing_catalog_output="$(
  PROJECT_ROOT="$ROOT_DIR" \
  COMPOSE_FILE="$ROOT_DIR/docker-compose.yml" \
  SERVICE_CATALOG_CLI="$ROOT_DIR/.github/scripts/does-not-exist.py" \
    bash "$IMAGES_SCRIPT" prepare 2>&1
)"; then
  echo "Regression: image preparation succeeded without the service catalog CLI"
  exit 1
fi
if ! grep -q 'Failed to resolve image preparation targets' <<< "$missing_catalog_output"; then
  echo "Regression: image preparation failure does not explain catalog resolution error"
  printf '%s\n' "$missing_catalog_output"
  exit 1
fi

python3 "$ROOT_DIR/.github/scripts/test_service_catalog.py" -v
python3 "$ROOT_DIR/.github/scripts/test_validate_alembic_graphs.py" -v

echo "Production workflows use catalog-driven reusable quality/security checks and executable migration gates"
