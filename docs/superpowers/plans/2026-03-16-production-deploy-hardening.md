# Production Deploy Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make production deploy and rollback deterministic by moving shared lifecycle logic into small production scripts and adding earlier Docker/build failure detection.

**Architecture:** Keep `docker-compose.deploy.yml` as the only production compose source, but move deploy/rollback lifecycle logic into `.github/scripts/production/*` helpers. `deploy.yml` and `rollback.yml` become thin orchestrators that reuse the same preflight, image preparation, migration, startup and metadata operations.

**Tech Stack:** GitHub Actions, Bash, Docker Compose, jq

---

## File Structure

- Create: `.github/scripts/production/common.sh`
  Shared shell helpers for compose invocation, logging, retry, and common guards.
- Create: `.github/scripts/production/preflight.sh`
  Early production environment checks before build or migration.
- Create: `.github/scripts/production/images.sh`
  External image pre-pull and local image build orchestration.
- Create: `.github/scripts/production/migrations.sh`
  Shared API image preparation and `prisma migrate deploy` execution.
- Create: `.github/scripts/production/release.sh`
  Shared `docker compose up` behavior and failure diagnostics.
- Create: `.github/scripts/production/metadata.sh`
  Shared read/write helpers for `/opt/parseVK/.deployment-metadata.json`.
- Modify: `.github/workflows/deploy.yml`
  Replace duplicated shell blocks with calls into production scripts.
- Modify: `.github/workflows/rollback.yml`
  Reuse the same production script layer for rollback.
- Modify: `.github/scripts/health-check.sh`
  Align interface and diagnostics with the new production script layer if needed.
- Modify: `.github/scripts/http-health-check.sh`
  Align interface and diagnostics with the new production script layer if needed.
- Modify: `docker-compose.deploy.yml`
  Only if needed for production reliability or image-preparation clarity.
- Test: `scripts/test-deploy-workflow.sh`
  Extend workflow regression checks where practical.

## Chunk 1: Shared Production Script Layer

### Task 1: Lock the metadata helper contract

**Files:**
- Create: `.github/scripts/production/metadata.sh`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/rollback.yml`

- [ ] **Step 1: Write a failing shell regression test or script assertion**

Add a lightweight regression check that proves both workflows can consume the same metadata helper contract, for example by grepping for direct metadata file mutation blocks that should be removed once the helper exists.

- [ ] **Step 2: Run the regression check to verify it fails**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: FAIL or require extension because metadata logic is still duplicated in the workflows.

- [ ] **Step 3: Implement the minimal metadata helper**

Create `.github/scripts/production/metadata.sh` with small functions such as:
- `read_last_successful_commit`
- `read_last_successful_deploy_time`
- `write_last_successful_deploy`

Replace direct JSON mutation blocks in both workflows with helper calls.

- [ ] **Step 4: Run the regression check to verify it passes**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: PASS for the metadata-related assertions.

- [ ] **Step 5: Commit**

```bash
git add .github/scripts/production/metadata.sh .github/workflows/deploy.yml .github/workflows/rollback.yml scripts/test-deploy-workflow.sh
git commit -m "ci: вынесено управление deployment metadata"
```

### Task 2: Introduce shared production compose helpers

**Files:**
- Create: `.github/scripts/production/common.sh`
- Create: `.github/scripts/production/preflight.sh`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/rollback.yml`

- [ ] **Step 1: Write a failing regression check for shared preflight usage**

Extend or add a shell-level regression check that asserts deploy and rollback both invoke the same production preflight helper instead of maintaining separate inline checks.

- [ ] **Step 2: Run the regression check to verify it fails**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: FAIL because the current workflows still embed their own checks.

- [ ] **Step 3: Implement minimal shared preflight/common helpers**

Create:
- `.github/scripts/production/common.sh` for `compose_cmd`, retry wrappers, structured failure output;
- `.github/scripts/production/preflight.sh` for Docker availability, compose validation, `.env` checks, optional registry reachability and required network/volume checks.

Wire both workflows to call the preflight helper early.

- [ ] **Step 4: Run the regression check to verify it passes**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: PASS for preflight usage assertions.

- [ ] **Step 5: Commit**

```bash
git add .github/scripts/production/common.sh .github/scripts/production/preflight.sh .github/workflows/deploy.yml .github/workflows/rollback.yml scripts/test-deploy-workflow.sh
git commit -m "ci: добавлен общий production preflight"
```

## Chunk 2: Image Preparation and Migrations

### Task 3: Make base-image failures visible before long builds

**Files:**
- Create: `.github/scripts/production/images.sh`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/rollback.yml`
- Modify: `docker-compose.deploy.yml` (only if helper behavior needs explicit image grouping)

- [ ] **Step 1: Write a failing regression check for explicit image preparation**

Add a test or grep-based assertion that deploy and rollback run a shared image preparation helper before local `docker compose build`, instead of relying on inline build blocks alone.

- [ ] **Step 2: Run the regression check to verify it fails**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: FAIL because image preparation is still embedded inside workflow YAML.

- [ ] **Step 3: Implement the minimal image-preparation helper**

Create `.github/scripts/production/images.sh` to:
- pre-pull external runtime images as needed;
- pre-pull likely base/build images such as `oven/bun:1` with retry and timeout;
- build only the requested local application images;
- fail fast with an explicit message when pull/build prerequisites are unavailable.

Replace inline build logic in deploy and rollback with the helper.

- [ ] **Step 4: Run the regression check to verify it passes**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: PASS for image-preparation assertions.

- [ ] **Step 5: Commit**

```bash
git add .github/scripts/production/images.sh .github/workflows/deploy.yml .github/workflows/rollback.yml docker-compose.deploy.yml scripts/test-deploy-workflow.sh
git commit -m "ci: нормализована подготовка production images"
```

### Task 4: Unify migration execution for deploy and rollback-safe paths

**Files:**
- Create: `.github/scripts/production/migrations.sh`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/rollback.yml`

- [ ] **Step 1: Write a failing regression check for shared migration execution**

Add a shell-level assertion that deploy no longer runs inline `docker compose run ... prisma migrate deploy`, but delegates to a shared migration helper.

- [ ] **Step 2: Run the regression check to verify it fails**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: FAIL because migrations are still handled inline in deploy.

- [ ] **Step 3: Implement the minimal migration helper**

Create `.github/scripts/production/migrations.sh` that:
- ensures the API image already exists before running migrations;
- runs `prisma migrate deploy` without hidden builds;
- prints `api` and `db` logs on failure;
- can be reused by deploy and, if needed later, by rollback-compatible paths.

Replace the inline migration block in `deploy.yml` with the helper.

- [ ] **Step 4: Run the regression check to verify it passes**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: PASS for migration-helper assertions.

- [ ] **Step 5: Commit**

```bash
git add .github/scripts/production/migrations.sh .github/workflows/deploy.yml scripts/test-deploy-workflow.sh
git commit -m "ci: вынесен production migration runner"
```

## Chunk 3: Release and Health Path

### Task 5: Normalize service startup and failure diagnostics

**Files:**
- Create: `.github/scripts/production/release.sh`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/rollback.yml`

- [ ] **Step 1: Write a failing regression check for shared release behavior**

Add an assertion that deploy and rollback use the same release helper for `docker compose up`, rather than separate inline startup loops.

- [ ] **Step 2: Run the regression check to verify it fails**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: FAIL because startup behavior is still duplicated between workflows.

- [ ] **Step 3: Implement the minimal release helper**

Create `.github/scripts/production/release.sh` to:
- run `docker compose up` with explicit `--no-build` vs build expectation;
- emit consistent compose status and logs on failure;
- support deploy and rollback via env/config flags rather than separate code paths.

Replace inline startup blocks in both workflows with the helper.

- [ ] **Step 4: Run the regression check to verify it passes**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: PASS for release-helper assertions.

- [ ] **Step 5: Commit**

```bash
git add .github/scripts/production/release.sh .github/workflows/deploy.yml .github/workflows/rollback.yml scripts/test-deploy-workflow.sh
git commit -m "ci: унифицирован запуск production сервисов"
```

### Task 6: Align health-check entry points with the shared production layer

**Files:**
- Modify: `.github/scripts/health-check.sh`
- Modify: `.github/scripts/http-health-check.sh`
- Modify: `.github/workflows/rollback.yml`
- Modify: `.github/workflows/deploy.yml` (only if deploy starts using explicit post-release health wiring)

- [ ] **Step 1: Write a failing regression check for health helper compatibility**

Add a regression check that the health-check scripts accept the environment and service-selection contract used by the new production helpers.

- [ ] **Step 2: Run the regression check to verify it fails**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: FAIL or expose incompatibility if the current scripts assume older inline workflow behavior.

- [ ] **Step 3: Implement the minimal health-check alignment**

Adjust the health scripts only as needed to:
- work cleanly with production helper env vars;
- emit shorter, more targeted diagnostics;
- preserve existing health semantics.

- [ ] **Step 4: Run the regression check to verify it passes**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add .github/scripts/health-check.sh .github/scripts/http-health-check.sh .github/workflows/deploy.yml .github/workflows/rollback.yml scripts/test-deploy-workflow.sh
git commit -m "ci: выровнены production health checks"
```

## Chunk 4: End-to-End Verification

### Task 7: Validate workflow and compose integrity after refactor

**Files:**
- Modify: none

- [ ] **Step 1: Validate workflow references and regression checks**

Run: `bash scripts/test-deploy-workflow.sh`
Expected: PASS

- [ ] **Step 2: Validate production compose config**

Run: `docker compose -f docker-compose.deploy.yml config > /tmp/parsevk-deploy-compose.out`
Expected: command exits `0`

- [ ] **Step 3: Lint shell scripts if shellcheck is available**

Run: `command -v shellcheck >/dev/null 2>&1 && shellcheck .github/scripts/production/*.sh .github/scripts/health-check.sh .github/scripts/http-health-check.sh || true`
Expected: no blocking errors

- [ ] **Step 4: Record residual manual verification**

Document the remaining manual or server-side checks:
- trigger a dry-run production deploy on the self-hosted runner;
- verify base-image pull failure surfaces early and clearly;
- verify rollback still works for a previously deployed commit;
- verify metadata is updated only after successful release.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: добавлены проверки production deploy hardening"
```
