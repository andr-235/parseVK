#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY="$ROOT_DIR/.github/workflows/deploy.yml"
ROLLBACK="$ROOT_DIR/.github/workflows/rollback.yml"
CI="$ROOT_DIR/.github/workflows/ci.yml"
SECURITY="$ROOT_DIR/.github/workflows/security.yml"
QUALITY="$ROOT_DIR/.github/workflows/reusable-python-quality.yml"
PY_SECURITY="$ROOT_DIR/.github/workflows/reusable-python-security.yml"
DOCKER_SECURITY="$ROOT_DIR/.github/workflows/reusable-docker-security.yml"
ALEMBIC="$ROOT_DIR/.github/workflows/reusable-alembic-migration.yml"
IMAGES="$ROOT_DIR/.github/scripts/production/images.sh"

required=(
  "$DEPLOY" "$ROLLBACK" "$CI" "$SECURITY" "$QUALITY" "$PY_SECURITY"
  "$DOCKER_SECURITY" "$ALEMBIC" "$ROOT_DIR/.github/service-catalog.yaml"
  "$ROOT_DIR/.github/scripts/service_catalog.py"
  "$ROOT_DIR/.github/scripts/validate_alembic_graphs.py"
  "$ROOT_DIR/.github/scripts/alembic_graph.py"
  "$ROOT_DIR/.github/scripts/service_catalog_lib/__init__.py"
)
for file in "${required[@]}"; do
  [[ -f "$file" ]] || { echo "Required CI/CD file not found: $file"; exit 1; }
done

for workflow in "$QUALITY" "$PY_SECURITY" "$DOCKER_SECURITY" "$ALEMBIC"; do
  grep -q 'workflow_call:' "$workflow" || {
    echo "Reusable workflow does not declare workflow_call: $workflow"; exit 1;
  }
done

require_pattern() {
  local file="$1" pattern="$2" message="$3"
  grep -Eq -- "$pattern" "$file" || { echo "$message"; exit 1; }
}

reject_pattern() {
  local file="$1" pattern="$2" message="$3"
  if grep -Eq -- "$pattern" "$file"; then echo "$message"; exit 1; fi
}

require_pattern "$CI" 'service_matrix:.*steps\.services\.outputs\.value' \
  "Python service matrix is not catalog-driven"
require_pattern "$CI" 'uses: \./\.github/workflows/reusable-python-quality\.yml' \
  "CI does not call reusable Python quality"
require_pattern "$CI" 'quality_workflow_changed:.*steps\.filter\.outputs\.quality_workflow_changed' \
  "CI does not expose reusable quality workflow changes"
require_pattern "$CI" 'quality-workflow-smoke:' \
  "CI does not smoke-test reusable Python quality"
require_pattern "$CI" 'service: identity-service' \
  "Reusable Python quality smoke service is missing"
require_pattern "$CI" 'QUALITY_WORKFLOW_RESULT:.*needs\.quality-workflow-smoke\.result' \
  "Release Gate does not collect quality smoke result"
require_pattern "$CI" 'require_conditional "Smoke reusable Python quality"' \
  "Release Gate does not enforce quality smoke"
require_pattern "$CI" 'migration_matrix:.*steps\.migrations\.outputs\.value' \
  "Migration matrix is not catalog-driven"
require_pattern "$CI" 'uses: \./\.github/workflows/reusable-alembic-migration\.yml' \
  "CI does not call reusable Alembic workflow"
require_pattern "$CI" 'require_conditional "Execute Alembic migrations"' \
  "Release Gate does not enforce executable migrations"
require_pattern "$CI" 'git diff .*"\$BASE_SHA\.\.\.\$HEAD_SHA"' \
  "CI change detection does not use merge-base diff"
reject_pattern "$CI" 'working-directory: services/\$\{\{ matrix\.service \}\}' \
  "Inline Python service quality returned to CI"

require_pattern "$QUALITY" 'uv sync --extra test --frozen' \
  "Reusable quality workflow does not install frozen test dependencies"
require_pattern "$QUALITY" 'uv run pytest -v' \
  "Reusable quality workflow does not execute tests"
require_pattern "$ALEMBIC" 'image: postgres:16\.14' \
  "Alembic workflow does not use PostgreSQL 16.14"
require_pattern "$ALEMBIC" 'uv run alembic upgrade head' \
  "Alembic workflow does not execute upgrade head"

require_pattern "$SECURITY" 'uses: \./\.github/workflows/reusable-python-security\.yml' \
  "Security does not call reusable Python audit"
require_pattern "$SECURITY" 'uses: \./\.github/workflows/reusable-docker-security\.yml' \
  "Security does not call reusable Docker scan"
reject_pattern "$SECURITY" 'aquasecurity/trivy-action' \
  "Inline Trivy implementation returned to Security"
require_pattern "$PY_SECURITY" 'uv audit --frozen --no-dev' \
  "Reusable Python security lost dependency audit"
require_pattern "$DOCKER_SECURITY" 'aquasecurity/trivy-action@v0\.36\.0' \
  "Reusable Docker security lost Trivy"
require_pattern "$DOCKER_SECURITY" 'github/codeql-action/upload-sarif@v4' \
  "Reusable Docker security lost SARIF upload"
require_pattern "$SECURITY" 'name: Security Gate' "Security Gate is missing"
require_pattern "$CI" 'name: Release Gate' "Release Gate is missing"

require_pattern "$DEPLOY" 'REQUIRED_WORKFLOWS=\("CI" "Security Scanning"\)' \
  "Deploy does not wait for CI and Security"
require_pattern "$DEPLOY" 'needs\.gate\.outputs\.deploy == .true.' \
  "Deploy is not gated"
require_pattern "$DEPLOY" '--purpose deploy' \
  "Deploy targets are not catalog-driven"
reject_pattern "$DEPLOY" 'workflow_dispatch\.inputs.*ref|inputs\.ref|TARGET_REF' \
  "Manual deploy accepts arbitrary refs"
reject_pattern "$DEPLOY" 'BUILD_(FRONTEND|API_GATEWAY|IDENTITY_SERVICE|TASKS_SERVICE)' \
  "Hard-coded service build flags returned"

health_line="$(grep -n 'Verify container health' "$DEPLOY" | head -n1 | cut -d: -f1)"
metadata_line="$(grep -n 'Update deployment metadata' "$DEPLOY" | head -n1 | cut -d: -f1)"
[[ -n "$health_line" && -n "$metadata_line" && "$health_line" -lt "$metadata_line" ]] || {
  echo "Deployment metadata can be written before health verification"; exit 1;
}

for helper in common metadata preflight images migrations release; do
  [[ -f "$ROOT_DIR/.github/scripts/production/$helper.sh" ]] || {
    echo "Missing production helper: $helper.sh"; exit 1;
  }
done
reject_pattern "$DEPLOY" 'docker compose -f "\$COMPOSE_FILE" (build|up)' \
  "Production lifecycle leaked into deploy YAML"
reject_pattern "$ROLLBACK" 'docker compose -f "\$COMPOSE_FILE" (build|up)' \
  "Production lifecycle leaked into rollback YAML"

missing_output=""
if missing_output="$(
  PROJECT_ROOT="$ROOT_DIR" COMPOSE_FILE="$ROOT_DIR/docker-compose.yml" \
  SERVICE_CATALOG_CLI="$ROOT_DIR/.github/scripts/missing.py" \
    bash "$IMAGES" prepare 2>&1
)"; then
  echo "Image preparation succeeded without catalog CLI"; exit 1
fi
grep -q 'Failed to resolve image preparation targets' <<<"$missing_output" || {
  echo "Catalog resolution error is not explained"; exit 1;
}

implementation_files=(
  "$ROOT_DIR/.github/scripts/service_catalog.py"
  "$ROOT_DIR/.github/scripts/alembic_graph.py"
  "$ROOT_DIR/.github/scripts/validate_alembic_graphs.py"
  "$ROOT_DIR"/.github/scripts/service_catalog_lib/*.py
)
for file in "${implementation_files[@]}"; do
  lines="$(wc -l < "$file")"
  (( lines <= 150 )) || { echo "Python module exceeds 150 lines: $file ($lines)"; exit 1; }
done

python3 "$ROOT_DIR/.github/scripts/test_service_catalog.py" -v
python3 "$ROOT_DIR/.github/scripts/test_validate_alembic_graphs.py" -v
echo "CI/CD reusable workflows, migration gates and production contracts are valid"
