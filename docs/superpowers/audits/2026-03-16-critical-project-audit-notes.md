# Critical Audit Notes

## Criteria

- production outage or broken critical user path
- auth bypass or forced logout / broken auth lifecycle
- data corruption, data loss, or inconsistent persistence
- deploy, rollback, migration, or startup fatal path
- queue or worker fatal inconsistency

## Strong signals

- `docs/nestjs-architecture-review.md` previously flagged `PrismaService` lifecycle as critical.
- `front/src/app/providers/AuthProvider.tsx` and `front/src/modules/auth/lib/authSession.ts` require refresh-flow verification.
- `.github/workflows/deploy.yml`, `.github/workflows/rollback.yml`, `.github/workflows/release.yml`, and `.github/workflows/security.yml` need deploy integrity and rollback-safety checks.

## auth-session

### Confirmed candidate

- Candidate: expired access token can leave frontend in authenticated-but-broken state after transient refresh failure.
  - Evidence:
    - `front/src/app/providers/AuthProvider.tsx:18-25` always calls `setIsReady(true)` after bootstrap, even if `refreshAccessToken()` returns `null`.
    - `front/src/App.tsx:31-39` and `front/src/App.tsx:83-131` treat any non-null `accessToken && user` as authenticated, without validating token freshness.
    - `front/src/shared/api/apiUtils.ts:82-89` retries once after `401`, then returns the original `401` response if refresh still fails.
    - `front/src/modules/auth/lib/authSession.ts:70-85` keeps stale auth state on transient refresh failure by design.
  - Failure mode: user stays inside protected routes with an expired token, but critical API requests degrade to `401` until refresh later succeeds or user manually re-authenticates.
  - Verification:
    - `cd front && bun x vitest run --project unit src/modules/auth/lib/__tests__/authSession.test.ts src/app/providers/__tests__/AuthProvider.test.tsx`
    - Current tests pass, but they only verify helper transient-failure behavior and scheduling; they do not cover bootstrap with expired token plus failed refresh.

## prisma-db-lifecycle

### Rejected candidate

- Previous critical signal from `docs/nestjs-architecture-review.md` about multiple `PrismaService` providers is outdated for current codebase.
  - Evidence:
    - `api/src/prisma.module.ts:1-8` provides a global `PrismaModule`.
    - `rg -n "providers:\\s*\\[[^\\]]*PrismaService" api/src --glob '!**/generated/**'` now returns only `api/src/prisma.module.ts` and `api/src/tgmbase-prisma/tgmbase-prisma.module.ts`.
  - Result: do not include duplicated Prisma provider issue in final `P0/P1` registry.

## queues-background-jobs

### Rejected candidate

- No confirmed `P0/P1` failure found in current queue/watchlist monitoring path from sampled sources.
  - Evidence:
    - `api/src/tasks/queues/parsing.processor.ts` updates status, clears cancellation state, and rethrows for BullMQ retry.
    - `api/src/watchlist/watchlist.monitor.service.ts` isolates periodic refresh failures without crashing the interval loop.
    - `cd api && bun x vitest run src/auth/auth.service.spec.ts src/watchlist/watchlist.monitor.service.spec.ts src/tasks/parsing-queue.service.spec.ts` passes.
  - Result: leave queue/watchlist area out of the final critical registry unless a stronger reproducible failure is found later.

## deploy-rollback

### Confirmed candidate

- Candidate: rollback workflow can restart the wrong application image even after checking out the target commit.
  - Evidence:
    - `docker-compose.deploy.yml:35-40`, `64-73`, `95-107` define `db_backup`, `api`, and `frontend` as locally built images (`parsevk-*:local`) with build contexts.
    - `.github/workflows/rollback.yml:181-210` only runs `docker compose pull --ignore-pull-failures` and `docker compose up -d --pull always`, without `docker compose build` or `up --build`.
  - Failure mode: checkout moves the working tree to the target commit, but containers can still start from the most recently built local image tag rather than from code of the rollback commit, producing a false rollback during an incident.
  - Severity rationale: this is an operational `P0/P1` because rollback is expected to be a reliable recovery path and this workflow can silently fail that expectation.

- Candidate: rollback workflow reverts application code and containers without any schema compatibility check or database rollback step.
  - Evidence:
    - `.github/workflows/rollback.yml:103-120` force-checks out the target commit.
    - `.github/workflows/rollback.yml:181-236` only pulls/starts containers and runs health checks.
    - No step in `.github/workflows/rollback.yml:32-240` validates schema compatibility or performs down-migration/data rollback.
  - Failure mode: rolling back to an older app revision after a forward migration can leave old code running against a newer schema, breaking production at startup or during live traffic.
  - Severity rationale: this is an operational `P1` because rollback is used precisely during incidents, and schema mismatch can turn recovery into a longer outage.

### Rejected candidate

- Candidate “deploy workflow can ship a different commit from validated CI SHA” is not confirmed for the current workflow-run path.
  - Evidence:
    - `.github/workflows/deploy.yml:67-90` selects `github.event.workflow_run.head_sha` for CI-triggered deploys.
    - `.github/workflows/deploy.yml:103-115` fetches and checks out exactly `TARGET_SHA`.
  - Result: exclude this from final registry; manual `workflow_dispatch` still deploys `origin/main`, but that is an explicit operator action rather than a hidden integrity bug.

## docker-runtime

### Confirmed candidate

- Candidate: production deploy compose exposes privileged internal services and static credentials on the host.
  - Evidence:
    - `docker-compose.deploy.yml:5-6` publishes PostgreSQL on `5433:5432`.
    - `docker-compose.deploy.yml:24-25` publishes Redis on `6379:6379` without any auth configuration.
    - `docker-compose.deploy.yml:131-132`, `165-166`, `181-182` publish Prometheus, node-exporter, and Grafana.
    - `docker-compose.deploy.yml:187-190` hardcodes `GF_SECURITY_ADMIN_PASSWORD=admin123`.
    - `docker-compose.deploy.yml:7-10` and `44-49` use default plaintext database credentials in the deploy compose itself.
  - Failure mode: exposed infra services and default credentials materially increase the chance of unauthorized access to data, cache, and monitoring plane on the production host.
  - Severity rationale: this is a confirmed security `P0/P1` because the deploy workflow uses `docker-compose.deploy.yml` directly (`.github/workflows/deploy.yml:29-32`).

### Confirmed candidate

- Candidate: backend entrypoint auto-marks failed migrations as applied.
  - Evidence:
    - `api/Dockerfile.deploy:49-56` makes `api/deploy/backend-entrypoint.sh` the production entrypoint.
    - `api/deploy/backend-entrypoint.sh:229-265` traps `prisma migrate deploy` failure, detects `P3009`, extracts a migration name, and runs `prisma migrate resolve --applied "$MIGRATION_NAME"`.
    - `api/deploy/backend-entrypoint.sh:275-316` repeats the same pattern for `"already exists"` migration errors.
  - Failure mode: a genuinely failed migration can be recorded as applied without the schema/data being in the expected state, creating silent drift and later data corruption or runtime failures.
  - Severity rationale: this is a data-safety `P0` because it mutates migration state during failure handling instead of preserving the failure for human intervention.

## monitoring-healthchecks

### Candidate under review

- Candidate: health signaling may be too shallow because backend healthcheck only probes `/api/health`.
  - Evidence:
    - `docker/backend-healthcheck.mjs:1-10` checks only HTTP `200` from `/api/health`.
  - Status: not yet critical by itself; keep out of final registry unless a stronger failure path is found.

## frontend-runtime

### Linked to auth-session

- No additional standalone `P0/P1` frontend runtime issue confirmed beyond auth/session lifecycle at this stage.

## ci-cd-security

### Linked to deploy-rollback and docker-runtime

- Current confirmed CI/CD criticals are the rollback schema gap and deploy compose security exposure.
