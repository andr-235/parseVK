# Fix: Deploy to Production Server

**Branch:** `main` (hotfix)
**Created:** 2026-06-17
**Type:** fix

## Settings
- Testing: no
- Logging: verbose
- Docs: no

## Root Causes

### 1. Volume `postgres_data` — missing `external: true`
**Commit:** `801e2e5b`
**File:** `docker-compose.yml:711`

Было удалено `external: true` у volume `postgres_data`. Docker Compose теперь пытается управлять этим volume, но он уже существует как external и содержит production-данные. Это блокирует старт `db` контейнера, что каскадно роняет весь стек (api-gateway и все downstream сервисы не стартуют).

**Лог:** `Container f5592038f05a_parsevk-db-1 Error dependency db failed to start`

### 2. im-migrate — exit code 1
**Файлы:** `services/im-service/Dockerfile`, `services/im-service/alembic/versions/20260608_0001_create_im_tables.py`

Alembic migration падает с exit code 1 сразу после инициализации контекста. Возможные причины:
- Миграция уже была применена в предыдущем деплое, но alembic_version не в синхронизации
- Смена базового образа `python:3.12.13-slim` → `python:3.12-slim` могла внести несовместимость

### 3. telegram-service — pydantic ValidationError
**Файл:** `services/telegram-service/Dockerfile`

`TELEGRAM_API_ID` передаётся как пустая строка, pydantic ожидает `int`. Это блокирует старт telegram-service.

**Лог:** `pydantic_core._pydantic_core.ValidationError: 1 validation error for Settings / TELEGRAM_API_ID / Input should be a valid integer, unable to parse string as an integer`

### 4. (Сопутствующее) Неп repinned базовый образ
Во всех Dockerfile `python:3.12.13-slim` заменён на `python:3.12-slim`. Это теряет детерминированность сборки — каждый раз может тянуться новый патч-релиз.

## Tasks

### Task 1: Restore `external: true` for postgres_data volume
**File:** `docker-compose.yml:711`
**Action:** Вернуть `external: true` перед `name: parsevk_postgres_data`. ✅
**Why:** Volume существует как external и содержит production данные. Без этого флага `docker compose up` пытается создать его заново, что ломает `db` контейнер.

### Task 2: Fix im-migrate failure
**Files:** `services/im-service/alembic/versions/20260608_0001_create_im_tables.py`
**Action:** Переписал миграцию на `CREATE TABLE IF NOT EXISTS` и `CREATE INDEX IF NOT EXISTS` — идемпотентна. ✅

### Task 3: Fix telegram-service env validation
**File:** `services/telegram-service/app/core/config.py`
**Action:** Добавил `@field_validator("telegram_api_id", mode="before")` — пустая строка конвертируется в `None`. ✅

### Task 4: Пропинговать базовый образ Python
**Files:** Все 8 `services/*/Dockerfile`
**Action:** `python:3.12-slim` → `python:3.12.13-slim` во всех Dockerfile. ✅

### Task 5: Удалить db_backup из deploy.yml
**File:** `.github/workflows/deploy.yml`
**Action:** Удалены 6 references: `BUILD_DB_BACKUP` variable, change detection, GITHUB_OUTPUT, build step. ✅
**Why:** Сервис `db_backup` удалён из `docker-compose.yml` в `331fe434`, но deploy.yml остался не обновлён. При деплое `docker compose build db_backup` падает с exit code 1.

### Task 6: Удалить db_backup из rollback.yml
**File:** `.github/workflows/rollback.yml`
**Action:** Удалён `db_backup` из аргументов `images.sh` prepare/build. ✅

### Task 7: Удалить db_backup из images.sh
**File:** `.github/scripts/production/images.sh`
**Action:** Удалены блоки `db_backup` в `pull_runtime_images_for_services` и `pull_build_base_images_for_services`. ✅

### Task 8: Sync python base image tag в images.sh
**File:** `.github/scripts/production/images.sh`
**Action:** `python:3.12-slim` → `python:3.12.13-slim` (14 occurrences) для единообразия с Dockerfile. ✅

## Commit Plan

1. `fix(deploy): restore external: true for postgres_data volume`
2. `fix(im-service): handle existing tables in initial migration`
3. `fix(telegram-service): make TELEGRAM_API_ID optional with fallback`
4. `chore(docker): pin python base image to 3.12.13-slim`
5. `fix(deploy): remove db_backup legacy references from deploy scripts`

## Validation

После каждого фикса:
- `docker compose build` для затронутых сервисов
- Проверить, что `docker compose up -d db` стартует без ошибок
- Запустить деплой через `workflow_dispatch` на GitHub

## Rollback

Если горячий фикс не помогает — откатить `main` на `66d213d2` (v0.33.3, последний стабильный) через `git revert`.
