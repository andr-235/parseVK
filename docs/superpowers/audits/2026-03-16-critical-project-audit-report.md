# Critical Project Audit Report

Дата: 2026-03-16

Спецификация аудита: `docs/superpowers/specs/2026-03-16-critical-project-audit-design.md`

## Confirmed P0

### P0-01: Rollback workflow can restart the wrong application image

- Area: `ci/cd`, `deploy`, `docker`
- Evidence:
  - `docker-compose.deploy.yml:35-40`, `docker-compose.deploy.yml:64-73`, `docker-compose.deploy.yml:95-107` define `db_backup`, `api`, and `frontend` as locally built images with tags `parsevk-*:local`.
  - `.github/workflows/rollback.yml:181-210` only executes `docker compose pull --ignore-pull-failures` and `docker compose up -d --pull always`.
  - No `docker compose build` or `docker compose up --build` step exists in rollback workflow after checkout.
- Why critical: during an incident, operator expects rollback to restore the previous known-good revision. Current workflow can silently restart the most recently built local images instead.
- Failure mode: target commit is checked out, but containers still come from stale local image tags, so rollback completes successfully in CI while production keeps running the wrong code.
- Minimal fix: rebuild local images from the checked-out target commit during rollback or switch rollback to immutable versioned images tied to commit SHA.

### P0-02: Production backend entrypoint can mark failed migrations as applied

- Area: `data`, `deploy`, `api`
- Evidence:
  - `api/Dockerfile.deploy:49-56` installs `api/deploy/backend-entrypoint.sh` as the production entrypoint.
  - `api/deploy/backend-entrypoint.sh:229-265` catches failed `prisma migrate deploy`, detects `P3009`, and runs `prisma migrate resolve --applied`.
  - `api/deploy/backend-entrypoint.sh:275-316` repeats the same mutation for `"already exists"` paths.
- Why critical: this changes migration history during failure handling instead of preserving failure, which can create schema drift and non-obvious data corruption.
- Failure mode: migration partially fails, entrypoint marks it applied anyway, app continues startup against a database whose real schema does not match Prisma migration state.
- Minimal fix: remove automatic `migrate resolve --applied` from production startup path; fail hard and require explicit operator intervention with documented remediation.

## Confirmed P1

### P1-01: Rollback workflow has no schema compatibility or database rollback guard

- Area: `ci/cd`, `deploy`, `data`
- Evidence:
  - `.github/workflows/rollback.yml:103-120` force-checks out a target commit.
  - `.github/workflows/rollback.yml:181-236` only restarts containers and health-checks them.
  - No schema compatibility validation, down-migration, or rollback-safety gate appears in `.github/workflows/rollback.yml:32-240`.
- Why critical: rollback is used during outages; an app-only rollback against a forward-migrated schema can prolong the incident rather than recover from it.
- Failure mode: older code boots against newer DB schema and fails at startup or on first critical query path.
- Minimal fix: add rollback preflight that checks migration compatibility, or block rollback unless target commit is schema-compatible with the currently deployed database.

### P1-02: Deploy compose exposes internal services and static credentials on the production host

- Area: `security`, `docker`, `deploy`
- Evidence:
  - `docker-compose.deploy.yml:5-6` publishes PostgreSQL on `5433:5432`.
  - `docker-compose.deploy.yml:24-25` publishes Redis on `6379:6379` without auth setup.
  - `docker-compose.deploy.yml:131-132`, `docker-compose.deploy.yml:165-166`, `docker-compose.deploy.yml:181-182` publish Prometheus, node-exporter, and Grafana.
  - `docker-compose.deploy.yml:187-190` hardcodes `GF_SECURITY_ADMIN_PASSWORD=admin123`.
  - `docker-compose.deploy.yml:7-10` and `docker-compose.deploy.yml:44-49` include default plaintext DB credentials in the deploy compose.
  - `.github/workflows/deploy.yml:29-32` confirms this compose file is the production deploy artifact.
- Why critical: privileged internal services are directly exposed with weak/default credentials, materially increasing the blast radius of any host or network exposure.
- Failure mode: attacker or unintended client reaches Redis/Postgres/monitoring endpoints and uses default or unauthenticated access to read, tamper with, or pivot through production infrastructure.
- Minimal fix: remove public port exposure for internal services by default, move credentials to secrets/env, require non-default passwords, and front monitoring endpoints with explicit auth/network restrictions.

### P1-03: Frontend auth bootstrap can leave the user in an authenticated-but-broken session

- Area: `front`, `auth`
- Evidence:
  - `front/src/app/providers/AuthProvider.tsx:18-25` always calls `setIsReady(true)` after bootstrap even if refresh returned `null`.
  - `front/src/App.tsx:31-39` and `front/src/App.tsx:83-131` consider any `accessToken && user` sufficient for authenticated routing.
  - `front/src/modules/auth/lib/authSession.ts:70-85` preserves auth state on transient refresh failure.
  - `front/src/shared/api/apiUtils.ts:82-89` retries once after `401` and then returns the original failing response if refresh still fails.
  - `cd front && bun x vitest run --project unit src/modules/auth/lib/__tests__/authSession.test.ts src/app/providers/__tests__/AuthProvider.test.tsx` passes, but current tests do not cover bootstrap with an already expired token and failed refresh.
- Why critical: a user can remain inside protected UI while the session is no longer usable, breaking the core authenticated workflow in a hard-to-understand way.
- Failure mode: app loads into protected routes with stale token state; subsequent API calls degrade to `401` until network conditions improve or the user manually re-authenticates.
- Minimal fix: on bootstrap, distinguish transient refresh failure from valid session readiness and add a deterministic fallback path for expired-token state, with explicit UX and tests.

## Rejected Candidates

- `PrismaService` duplicated provider issue from `docs/nestjs-architecture-review.md`.
  - Rejected because current code already has global `api/src/prisma.module.ts`, and repository search no longer shows duplicate provider registration in feature modules.

- “Deploy workflow can ship a different commit from validated CI SHA”.
  - Rejected because `.github/workflows/deploy.yml:67-115` fetches and checks out `github.event.workflow_run.head_sha` for CI-triggered deploys.

- Queue/watchlist fatal inconsistency in sampled worker paths.
  - Rejected because current reviewed paths did not show a confirmed `P0/P1` failure, and `cd api && bun x vitest run src/auth/auth.service.spec.ts src/watchlist/watchlist.monitor.service.spec.ts src/tasks/parsing-queue.service.spec.ts` passed.

- Backend healthcheck too shallow.
  - Rejected for now because `docker/backend-healthcheck.mjs` alone is not enough to prove a critical production failure path without a concrete scenario.

## Remediation Packages

### Package 1: Rollback Integrity

- Closes: `P0-01`, `P1-01`
- Scope:
  - `.github/workflows/rollback.yml`
  - `docker-compose.deploy.yml`
  - possibly release/deploy metadata helpers if rollback needs immutable image refs
- Approach:
  - ensure rollback rebuilds or pulls immutable SHA-tagged images for the target commit;
  - add schema compatibility preflight before restart;
  - fail rollback early if target commit is not DB-compatible.
- Risk: medium; touches incident-recovery path and deploy semantics.
- Verification:
  - dry-run rollback against a known earlier commit in staging;
  - confirm resulting running image/version matches requested target commit;
  - confirm rollback aborts on incompatible schema state.

### Package 2: Migration Safety

- Closes: `P0-02`
- Scope:
  - `api/deploy/backend-entrypoint.sh`
  - `api/Dockerfile.deploy`
  - deployment docs/runbooks
- Approach:
  - remove automatic mutation of migration history;
  - fail fast on migration error;
  - document operator playbook for failed migration recovery.
- Risk: medium; startup may fail more loudly until operational process is adjusted.
- Verification:
  - simulate failed migration in staging and confirm deploy exits non-zero without altering migration state;
  - validate documented manual recovery path.

### Package 3: Production Surface Hardening

- Closes: `P1-02`
- Scope:
  - `docker-compose.deploy.yml`
  - deployment secrets/config docs
  - monitoring access path
- Approach:
  - remove unnecessary host port exposure for DB/Redis/internal monitoring;
  - replace inline defaults with required secrets;
  - enforce non-default Grafana admin credentials and restricted network reachability.
- Risk: medium; may require operational changes on the host or reverse proxy.
- Verification:
  - `docker compose config` remains valid;
  - internal services are no longer reachable from unintended interfaces;
  - monitoring remains accessible through the intended secured path only.

### Package 4: Auth Session Recovery

- Closes: `P1-03`
- Scope:
  - `front/src/app/providers/AuthProvider.tsx`
  - `front/src/modules/auth/lib/authSession.ts`
  - `front/src/shared/api/apiUtils.ts`
  - related auth tests
- Approach:
  - explicitly model bootstrap outcomes for expired token + failed refresh;
  - avoid entering protected UI with unusable session state;
  - add coverage for bootstrap and transient refresh failure behavior.
- Risk: low to medium; affects login/session UX.
- Verification:
  - add tests for expired token on startup with transient and fatal refresh failures;
  - confirm protected routes are not entered with stale unusable token state.

## Recommended Execution Order

1. `Package 1: Rollback Integrity`
2. `Package 2: Migration Safety`
3. `Package 3: Production Surface Hardening`
4. `Package 4: Auth Session Recovery`

Reasoning:

- rollback and migration handling are incident-amplifying paths and should be fixed first;
- production surface hardening is a direct security exposure;
- auth session recovery is user-facing and important, but less destructive than data/deploy failure paths.
