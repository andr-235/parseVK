# Implementation Plan: Fix Deployment Container Build Failure

Branch: fix/deploy-container-build-failure
Created: 2026-06-17

## Settings
- Testing: yes
- Logging: verbose
- Docs: yes

## Roadmap Linkage
Milestone: "none"
Rationale: No applicable milestone in ROADMAP.md

## Commit Plan
- **Commit 1** (after tasks 1-3): "fix(deploy): add missing services to change detection, fix volume and dockerignore"
- **Commit 2** (after tasks 4-5): "fix(deploy): resolve preflight, tag mismatch, and deploy runbook"

## Tasks

### Phase 1: Fix Build Pipeline Gaps

- [x] Task 1: Fix change detection to cover all service Dockerfiles (HIGH)

  The `deploy.yml` change detection (lines 143-153) only tracks changes to `front/`, `docker/db-backup/`, and `services/im-service/`. Changes to other 7 Python service directories (e.g., `services/api-gateway/`) do NOT trigger rebuild.

  **File:** `.github/workflows/deploy.yml`

  **Action:** Add grep patterns for all service directories:
  - `services/identity-service/`
  - `services/tasks-service/`
  - `services/vk-service/`
  - `services/content-service/`
  - `services/moderation-service/`
  - `services/telegram-service/`
  - `services/api-gateway/`

  Also add `docker/frontend.Dockerfile` and `docker/frontend.nginx.conf` to the frontend pattern.

  **Logging:** Log the new change detection rules.

- [x] Task 2: Fix volume `postgres_data` external requirement (HIGH)

  Volume `postgres_data` at `docker-compose.yml:711` has `external: true`, meaning `docker compose up` will fail on a fresh deployment because Docker Compose won't auto-create it. All other 8 volumes are auto-created.

  **File:** `docker-compose.yml`

  **Action:** Remove `external: true` from the `postgres_data` volume definition. Keep `name: parsevk_postgres_data`.

  **Logging:** Log the change. Verify with `docker compose config`.

- [x] Task 3: Fix `.dockerignore` to not exclude service Dockerfiles (MEDIUM)

  The `.dockerignore` pattern `Dockerfile*` recursively matches `services/*/Dockerfile`, potentially excluding them from build context.

  **File:** `.dockerignore`

  **Action:** Change `Dockerfile*` to `Dockerfile` (root-level only).

  **Logging:** Log the change.

<!-- Commit checkpoint: tasks 1-3 -->

### Phase 2: Preflight and Safety

- [x] Task 4: Add PyPI reachability check to preflight (MEDIUM)

  After commit `7dda8fe2`, all Python Dockerfiles use `RUN pip install uv==0.11.6`. If PyPI is unreachable, build silently fails.

  **File:** `.github/scripts/production/preflight.sh`

  **Action:** Add `check_registry_reachability "https://pypi.org/simple/uv/" "PyPI"`.

  **Logging:** Log the new check.

- [x] Task 5: Standardize base image tag to `python:3.12-slim` across all Dockerfiles (LOW)

  Dockerfiles used pinned `python:3.12.13-slim` while images.sh used floating `python:3.12-slim`. Unified to floating tag for automatic patch updates.

  **Files:** All 8 service Dockerfiles

  **Action:** Changed `python:3.12.13-slim` → `python:3.12-slim` in all Dockerfiles.

<!-- Commit checkpoint: tasks 4-5 -->

### Phase 3: Documentation

- [x] Task 6: Update deploy runbook (Docs checkpoint)

  **Action:** Update documentation covering:
  - Pre-deployment checklist (volumes exist, network access, .env)
  - Troubleshooting guide for common build failures (BuildKit, PyPI access)
  - How to manually rebuild specific services on the production server
  - Verification steps after deployment

  **Files:** `docs/` directory

  **Logging:** Log documentation updates.
