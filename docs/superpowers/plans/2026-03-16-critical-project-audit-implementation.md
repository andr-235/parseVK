# Critical Project Audit Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Провести подтверждаемый аудит всего проекта, зафиксировать только `P0/P1` проблемы и подготовить по ним пакетный план исправлений.

**Architecture:** Работа делится на четыре последовательных блока: первичный risk sweep, подтверждение кандидатов, сборка critical registry и группировка найденных проблем в remediation-пакеты. Источником истины служат только код, конфиги, результаты проверок и воспроизводимые команды; speculation и stylistic feedback в итог не попадают.

**Tech Stack:** Git, ripgrep, TypeScript/React frontend, NestJS/Prisma backend, Docker Compose, GitHub Actions workflows, Vitest, ESLint, TypeScript compiler.

---

## Chunk 1: Сбор доказательств по критичным зонам

### Task 1: Подготовить рабочий реестр кандидатов

**Files:**
- Create: `docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md`
- Modify: `docs/superpowers/specs/2026-03-16-critical-project-audit-design.md`
- Reference: `docs/nestjs-architecture-review.md`
- Reference: `CLAUDE.md`

- [ ] **Step 1: Создать черновой audit-notes файл с секциями по зонам риска**

```md
# Critical Audit Notes

## auth-session
## prisma-db-lifecycle
## queues-background-jobs
## deploy-rollback
## docker-runtime
## monitoring-healthchecks
## frontend-runtime
## ci-cd-security
```

- [ ] **Step 2: Зафиксировать в notes уже известные сильные сигналы**

```md
- `docs/nestjs-architecture-review.md` указывает на риск жизненного цикла Prisma.
- `front/src/app/providers/AuthProvider.tsx` и `front/src/modules/auth/lib/authSession.ts` требуют проверки refresh flow.
- В репозитории есть `.github/workflows/deploy.yml`, `rollback.yml`, `release.yml`, `security.yml` — проверить путь деплоя и rollback safety.
```

- [ ] **Step 3: Сохранить рабочий список критериев отбора `P0/P1`**

```md
- production outage
- auth bypass / broken auth
- data corruption / data loss
- deploy or migration failure path
- queue/worker fatal inconsistency
```

- [ ] **Step 4: Проверить, что notes-файл создан и читается**

Run: `sed -n '1,200p' docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md`

Expected: файл существует и содержит секции по зонам риска.

- [ ] **Step 5: Закоммитить каркас аудита**

```bash
git add docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md docs/superpowers/specs/2026-03-16-critical-project-audit-design.md
git commit -m "docs: добавлен каркас аудита критических рисков"
```

### Task 2: Собрать кандидатов в `api` и `front`

**Files:**
- Reference: `api/src/app.module.ts`
- Reference: `api/src/prisma.module.ts`
- Reference: `api/src/prisma.service.ts`
- Reference: `api/src/tasks/**`
- Reference: `api/src/auth/**`
- Reference: `api/src/watchlist/**`
- Reference: `front/src/app/providers/AuthProvider.tsx`
- Reference: `front/src/modules/auth/lib/authSession.ts`
- Reference: `front/src/modules/tasks/**`
- Modify: `docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md`

- [ ] **Step 1: Просканировать backend на жизненный цикл БД, auth и фоновые задачи**

Run: `rg -n "PrismaService|new PrismaClient|BullModule|processor|queue|refresh|jwt|guard|Public\\(|Roles\\(" api/src --glob '!**/generated/**'`

Expected: список конкретных точек проверки по `api`.

- [ ] **Step 2: Просканировать frontend на auth/session и runtime-critical flows**

Run: `rg -n "refreshAccessToken|isTokenExpired|getRefreshDelayMs|clearAuth|accessToken|refreshToken|fetch\\(" front/src --glob '!**/*.test.*'`

Expected: список конкретных точек проверки по `front`.

- [ ] **Step 3: Выписать в notes только кандидатов с потенциальным `P0/P1` impact**

```md
- Candidate: refresh flow clears session too aggressively on specific HTTP statuses
  Evidence: front/src/modules/auth/lib/authSession.ts
- Candidate: queue or worker path bypasses repository / transaction boundary
  Evidence: api/src/tasks/...
```

- [ ] **Step 4: Исключить stylistic и medium-only замечания**

Run: вручную удалить из notes всё, что не имеет сценария отказа.

Expected: в notes остаются только кандидаты с возможным production/data/security impact.

- [ ] **Step 5: Закоммитить кандидатов runtime-слоёв**

```bash
git add docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md
git commit -m "docs: собраны кандидаты критических проблем runtime-слоёв"
```

### Task 3: Собрать кандидатов в infra/CI/CD/deploy

**Files:**
- Reference: `docker-compose.yml`
- Reference: `docker-compose.deploy.yml`
- Reference: `docker-compose.prod.yml`
- Reference: `docker/backend-entrypoint.sh`
- Reference: `docker/frontend-entrypoint.sh`
- Reference: `docker/backend-healthcheck.mjs`
- Reference: `.github/workflows/ci.yml`
- Reference: `.github/workflows/deploy.yml`
- Reference: `.github/workflows/release.yml`
- Reference: `.github/workflows/rollback.yml`
- Reference: `.github/workflows/security.yml`
- Modify: `docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md`

- [ ] **Step 1: Просканировать deployment и rollback flow**

Run: `sed -n '1,260p' .github/workflows/deploy.yml && sed -n '1,260p' .github/workflows/rollback.yml`

Expected: видны шаги deploy/rollback, есть материал для оценки safety и recoverability.

- [ ] **Step 2: Проверить docker startup path и healthchecks**

Run: `sed -n '1,260p' docker/backend-entrypoint.sh && sed -n '1,220p' docker/backend-healthcheck.mjs`

Expected: понятен boot path backend, миграции, generate/build, health behavior.

- [ ] **Step 3: Проверить compose-конфиги на продовые риски**

Run: `rg -n "ports:|5432|restart:|healthcheck|depends_on|env_file|DATABASE_URL|REDIS" docker-compose*.yml`

Expected: список сетевых и operational точек риска.

- [ ] **Step 4: Добавить в notes только подтверждаемые infra-кандидаты**

```md
- Candidate: deploy flow can ship revision different from validated commit
  Evidence: .github/workflows/deploy.yml:...
- Candidate: startup path can fail after partial migration/build step
  Evidence: docker/backend-entrypoint.sh:...
```

- [ ] **Step 5: Закоммитить infra/CI кандидатов**

```bash
git add docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md
git commit -m "docs: собраны кандидаты критических infra и ci рисков"
```

## Chunk 2: Подтверждение и отсев кандидатов

### Task 4: Подтвердить auth/session и frontend runtime проблемы

**Files:**
- Reference: `front/src/app/providers/AuthProvider.tsx`
- Reference: `front/src/modules/auth/lib/authSession.ts`
- Reference: `front/src/app/providers/__tests__/AuthProvider.test.tsx`
- Reference: `front/src/modules/auth/lib/__tests__/authSession.test.ts`
- Modify: `docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md`

- [ ] **Step 1: Прочитать существующие auth-тесты и определить, что уже подтверждено**

Run: `sed -n '1,260p' front/src/modules/auth/lib/__tests__/authSession.test.ts && sed -n '1,260p' front/src/app/providers/__tests__/AuthProvider.test.tsx`

Expected: понятны уже покрытые сценарии refresh/bootstrap.

- [ ] **Step 2: Запустить релевантные auth-тесты**

Run: `cd front && bun x vitest run --project unit src/modules/auth/lib/__tests__/authSession.test.ts src/app/providers/__tests__/AuthProvider.test.tsx`

Expected: PASS или FAIL с конкретным доказательством проблемы.

- [ ] **Step 3: Зафиксировать только подтверждённые auth-проблемы**

```md
- Confirmed P0/P1:
  - evidence
  - failure mode
  - affected user path
```

- [ ] **Step 4: Исключить неподтверждённые auth-гипотезы**

Run: вручную удалить из notes кандидаты без прямого доказательства.

Expected: auth-раздел notes содержит только подтверждённые проблемы.

- [ ] **Step 5: Закоммитить подтверждённые auth-находки**

```bash
git add docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md
git commit -m "docs: подтверждены критические проблемы авторизации"
```

### Task 5: Подтвердить backend/DB/queue проблемы

**Files:**
- Reference: `api/src/prisma.module.ts`
- Reference: `api/src/prisma.service.ts`
- Reference: `api/src/tasks/tasks.module.ts`
- Reference: `api/src/tasks/queues/parsing.processor.ts`
- Reference: `api/src/tasks/parsing-queue.service.ts`
- Reference: `api/src/watchlist/watchlist.monitor.service.ts`
- Reference: `api/src/auth/auth.service.ts`
- Modify: `docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md`

- [ ] **Step 1: Проверить реальное состояние Prisma wiring после архитектурного review**

Run: `rg -n "providers:\\s*\\[[^\\]]*PrismaService" api/src --glob '!**/generated/**'`

Expected: либо найдены дублирующие провайдеры Prisma, либо подтверждено, что проблема уже устранена.

- [ ] **Step 2: Проверить queue/worker path на явные критические сценарии отказа**

Run: `sed -n '1,260p' api/src/tasks/queues/parsing.processor.ts && sed -n '1,260p' api/src/tasks/parsing-queue.service.ts && sed -n '1,260p' api/src/watchlist/watchlist.monitor.service.ts`

Expected: видны retry/error-handling/transaction boundaries.

- [ ] **Step 3: При необходимости прогнать релевантные backend-тесты**

Run: `cd api && bun run test -- api/src/auth/auth.service.spec.ts api/src/watchlist/watchlist.monitor.service.spec.ts api/src/tasks/parsing-queue.service.spec.ts`

Expected: PASS или воспроизводимый FAIL с указанием конкретной критической проблемы.

- [ ] **Step 4: Зафиксировать только подтверждённые `api` проблемы**

```md
- Confirmed P0/P1:
  - db lifecycle
  - queue failure path
  - auth enforcement gap
```

- [ ] **Step 5: Закоммитить подтверждённые backend-находки**

```bash
git add docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md
git commit -m "docs: подтверждены критические проблемы backend и очередей"
```

### Task 6: Подтвердить infra/deploy/CI проблемы

**Files:**
- Reference: `.github/workflows/deploy.yml`
- Reference: `.github/workflows/rollback.yml`
- Reference: `.github/workflows/release.yml`
- Reference: `docker/backend-entrypoint.sh`
- Reference: `docker-compose.deploy.yml`
- Reference: `docker-compose.prod.yml`
- Modify: `docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md`

- [ ] **Step 1: Проверить, есть ли подтверждение риска “deploy не того коммита”**

Run: `rg -n "origin/main|git fetch|git checkout|git pull|workflow_dispatch|sha" .github/workflows/deploy.yml .github/workflows/release.yml .github/workflows/rollback.yml`

Expected: видно, deploy привязан к проверенному SHA или нет.

- [ ] **Step 2: Проверить startup path на partial-failure risk**

Run: `rg -n "migrate|prisma|generate|build|exit 1|health" docker/backend-entrypoint.sh docker/backend-healthcheck.mjs`

Expected: понятен сценарий частично успешного запуска и возможность застрять в broken state.

- [ ] **Step 3: Зафиксировать только подтверждённые infra/CI проблемы**

```md
- Confirmed P0/P1:
  - deploy integrity gap
  - rollback mismatch
  - startup or migration fatal path
```

- [ ] **Step 4: Убрать из notes всё, что не подтверждается кодом workflow/script**

Run: вручную удалить неподтверждённые conjectures.

Expected: infra-раздел содержит только подтверждённые риски.

- [ ] **Step 5: Закоммитить подтверждённые infra-находки**

```bash
git add docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md
git commit -m "docs: подтверждены критические infra и deploy риски"
```

## Chunk 3: Сборка итогового реестра и remediation-пакетов

### Task 7: Оформить critical registry

**Files:**
- Create: `docs/superpowers/audits/2026-03-16-critical-project-audit-report.md`
- Modify: `docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md`
- Reference: `docs/superpowers/specs/2026-03-16-critical-project-audit-design.md`

- [ ] **Step 1: Создать итоговый report-файл с шаблоном реестра**

```md
# Critical Project Audit Report

## Confirmed P0
## Confirmed P1
## Rejected Candidates
## Remediation Packages
```

- [ ] **Step 2: Перенести подтверждённые проблемы из notes в структурированный реестр**

```md
### P0-01: [title]
- Area:
- Evidence:
- Why critical:
- Failure mode:
- Minimal fix:
```

- [ ] **Step 3: Отдельно перечислить отклонённые кандидаты**

```md
- Candidate
  - reason rejected: no proof / medium only / already fixed
```

- [ ] **Step 4: Проверить report на полноту и отсутствие medium/low шума**

Run: `sed -n '1,260p' docs/superpowers/audits/2026-03-16-critical-project-audit-report.md`

Expected: в report только подтверждённые `P0/P1` и отклонённые кандидаты.

- [ ] **Step 5: Закоммитить итоговый critical registry**

```bash
git add docs/superpowers/audits/2026-03-16-critical-project-audit-report.md docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md
git commit -m "docs: собран реестр критических проблем проекта"
```

### Task 8: Сформировать remediation-пакеты и порядок внедрения

**Files:**
- Modify: `docs/superpowers/audits/2026-03-16-critical-project-audit-report.md`
- Modify: `docs/superpowers/plans/2026-03-16-critical-project-audit-implementation.md`
- Reference: `docs/superpowers/specs/2026-03-16-critical-project-audit-design.md`

- [ ] **Step 1: Сгруппировать проблемы в remediation-пакеты**

```md
## Remediation Package 1: Auth / Session Stability
- closes: P0-...
- files/modules:
- risk:
- verification:
```

- [ ] **Step 2: Для каждого пакета определить минимальную границу изменений**

```md
- do now
- defer
- dependency on previous package
```

- [ ] **Step 3: Выставить безопасный порядок внедрения**

```md
1. auth/session
2. prisma/db lifecycle
3. deploy/rollback safety
4. queues/workers
```

- [ ] **Step 4: Проверить, что каждый пакет можно исполнять отдельно**

Run: вручную проверить report against spec.

Expected: нет пакетов, которые требуют “переписать полпроекта” одним шагом.

- [ ] **Step 5: Закоммитить remediation-пакеты**

```bash
git add docs/superpowers/audits/2026-03-16-critical-project-audit-report.md docs/superpowers/plans/2026-03-16-critical-project-audit-implementation.md
git commit -m "docs: подготовлены remediation-пакеты по критическим рискам"
```

## Chunk 4: Верификация артефактов и handoff

### Task 9: Финальная верификация аудита

**Files:**
- Modify: `docs/superpowers/audits/2026-03-16-critical-project-audit-report.md`
- Modify: `docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md`
- Modify: `docs/superpowers/plans/2026-03-16-critical-project-audit-implementation.md`

- [ ] **Step 1: Проверить, что для каждой проблемы есть конкретные file references и evidence**

Run: `rg -n "^### P[01]-|^- Evidence:|^- Minimal fix:" docs/superpowers/audits/2026-03-16-critical-project-audit-report.md`

Expected: каждая запись полная.

- [ ] **Step 2: Проверить, что report не содержит неподтверждённых утверждений**

Run: вручную перечитать report и notes параллельно.

Expected: каждая критическая запись трассируется к notes и источнику доказательства.

- [ ] **Step 3: Проверить, что remediation order соответствует рискам и зависимостям**

Run: вручную проверить секцию `Remediation Packages`.

Expected: сначала наиболее рискованные и наименее зависимые пакеты.

- [ ] **Step 4: Зафиксировать финальную версию артефактов**

```bash
git add docs/superpowers/audits/2026-03-16-critical-project-audit-report.md docs/superpowers/audits/2026-03-16-critical-project-audit-notes.md docs/superpowers/plans/2026-03-16-critical-project-audit-implementation.md
git commit -m "docs: завершен план аудита критических ошибок"
```

- [ ] **Step 5: Подготовить handoff для следующего цикла**

```md
Next execution entrypoint:
- use `docs/superpowers/audits/2026-03-16-critical-project-audit-report.md`
- implement remediation package 1 first
```
