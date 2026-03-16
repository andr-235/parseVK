# Parsing Queue Regression Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Найти и исправить регресс, из-за которого задачи парсинга на проде стартуют через BullMQ, но зависают в состоянии `running` без движения прогресса.

**Architecture:** Сначала локализуем фактическую точку стопора на продовом сервере в цепочке `queue -> worker -> handler -> external dependency`, затем делаем минимальный фикс только в найденном узле. После фикса добавляем узкую страховку: логи, fail-fast или тест для общего пути выполнения задачи.

**Tech Stack:** Docker Compose, NestJS, BullMQ, Redis, Prisma, Bun, VK API

---

## File Map

- Read/verify: `docker-compose.deploy.yml`
- Read/verify: `api/src/app.module.ts`
- Read/verify: `api/src/tasks/tasks.module.ts`
- Read/verify: `api/src/tasks/queues/parsing.processor.ts`
- Read/verify: `api/src/tasks/commands/handlers/execute-parsing-task.handler.ts`
- Read/verify: `api/src/tasks/commands/handlers/process-group.handler.ts`
- Read/verify: `api/src/vk/**/*.ts`
- Modify if needed: backend file containing the confirmed regression point
- Modify if needed: targeted backend spec covering the broken path
- Create if needed: `docs/superpowers/specs/2026-03-16-parsing-queue-regression-design.md`

## Chunk 1: Продовая локализация

### Task 1: Подтвердить фактическое состояние деплоя и контейнеров

**Files:**
- Read: `/opt/parseVK/docker-compose.deploy.yml`
- Read: `/opt/parseVK/.env` if needed for non-secret keys only

- [ ] **Step 1: Подключиться к серверу и открыть рабочую директорию**

Run: `ssh deployer@172.168.88.12`
Expected: доступ к серверу и переход в `/opt/parseVK`

- [ ] **Step 2: Проверить compose и активные контейнеры**

Run: `docker compose -f docker-compose.deploy.yml ps`
Expected: `api` и `redis` в состоянии `Up`

- [ ] **Step 3: Проверить логи API вокруг зависшей задачи**

Run: `docker compose -f docker-compose.deploy.yml logs api --tail=300`
Expected: видно старт job и последнюю строку перед зависанием

- [ ] **Step 4: Зафиксировать вывод и сформулировать точку стопора**

Expected: понятный последний успешно пройденный этап

### Task 2: Проверить Redis/BullMQ состояние, не меняя данные

**Files:**
- Read: runtime state only

- [ ] **Step 1: Проверить доступность Redis из сети compose**

Run: `docker compose -f docker-compose.deploy.yml exec redis redis-cli ping`
Expected: `PONG`

- [ ] **Step 2: Проверить, есть ли активные или зависшие job**

Run: открыть shell в `api` и выполнить короткий one-off скрипт BullMQ для counts/active jobs
Expected: видны `waiting/active/failed/completed` и можно понять, stuck ли job

- [ ] **Step 3: Сопоставить job state с backend-логами**

Expected: подтверждение, что проблема либо доходит до worker, либо стопорится уже внутри handler

## Chunk 2: Сравнение с кодом и минимальный фикс

### Task 3: Сравнить проблемный узел с последними рефакторингами

**Files:**
- Read: `api/src/tasks/**`
- Read: `api/src/vk/**`
- Read: `git log`, `git diff`

- [ ] **Step 1: Вытащить недавние backend-коммиты по затронутому узлу**

Run: `git log --oneline -- api/src/tasks api/src/vk api/src/common`
Expected: список релевантных изменений

- [ ] **Step 2: Сравнить текущую реализацию с последним рабочим состоянием**

Run: `git diff <last-known-good>..HEAD -- <confirmed-files>`
Expected: короткий список подозрительных изменений

- [ ] **Step 3: Сформулировать минимальную гипотезу фикса**

Expected: одна конкретная причина и один узкий набор файлов

### Task 4: Закрыть регресс тестом и минимальной правкой

**Files:**
- Modify: только подтверждённый backend-файл
- Modify/Test: релевантный spec рядом с ним

- [ ] **Step 1: Написать или обновить падающий тест на общий сломанный путь**

Expected: тест воспроизводит найденный регресс

- [ ] **Step 2: Запустить только этот тест и увидеть падение**

Run: точечная команда `bun x vitest run ...` или проектный backend test command
Expected: FAIL по подтверждённой причине

- [ ] **Step 3: Внести минимальный фикс**

Expected: исправление только в общем пути, который ломает оба режима

- [ ] **Step 4: Повторно запустить точечный тест**

Expected: PASS

## Chunk 3: Верификация на проде

### Task 5: Проверить реальный запуск после фикса

**Files:**
- Read: runtime logs/UI state

- [ ] **Step 1: Задеплоить исправление штатным способом**

Expected: обновлённый `api` контейнер запущен

- [ ] **Step 2: Создать новую задачу парсинга**

Expected: новая задача стартует без вечного зависания на старой точке

- [ ] **Step 3: Проверить логи, статус и прогресс**

Expected: появляются события после текущей точки стопора, статус/прогресс двигаются

- [ ] **Step 4: Проверить оба сценария**

Expected: и обычный запуск, и `recheck_group` проходят общий сломанный этап

- [ ] **Step 5: Commit**

```bash
git add <touched-files> docs/superpowers/specs/2026-03-16-parsing-queue-regression-design.md docs/superpowers/plans/2026-03-16-parsing-queue-regression-implementation.md
git commit -m "fix: устранено зависание задач парсинга"
```

## Notes

- Не очищать Redis и не удалять job до локализации причины.
- Если найдётся расхождение между продом и репозиторием, сначала зафиксировать его как отдельный факт.
- Если проблема окажется только в окружении, заменить кодовый тест на проверку конфигурации или fail-fast при старте.
