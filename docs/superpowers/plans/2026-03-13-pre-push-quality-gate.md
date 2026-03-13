# Pre-Push Quality Gate Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить локальный строгий pre-push gate, который прогоняет format/lint/type-check/test для затронутых частей проекта до попадания ошибок в CI.

**Architecture:** Тонкий `.husky/pre-push` вызывает один orchestration-скрипт в `scripts/`, который вычисляет changed files и запускает backend/frontend проверки только там, где это нужно. Package scripts в `api` и `front` выравниваются под единый локальный и CI-friendly интерфейс `check:push`.

**Tech Stack:** Husky, lint-staged, Bash/Zsh shell, Bun, package.json scripts, Git diff

---

## File Structure

### Create

- `.husky/pre-push`
- `scripts/pre-push-check.sh`

### Modify

- `api/package.json`
- `front/package.json`
- `.github/workflows/ci.yml`
- `.lintstagedrc.js`

### Verify / related reads

- `.husky/pre-commit`
- `package.json`

## Chunk 1: Выравнивание package scripts

### Task 1: Добавить явный `typecheck` и `check:push` для frontend

**Files:**
- Modify: `front/package.json`

- [ ] **Step 1: Написать failing check на отсутствие script**

Run: `cd front && node -e "const pkg=require('./package.json'); if(!pkg.scripts.typecheck||!pkg.scripts['check:push']) process.exit(1)"`
Expected: FAIL, потому что scripts ещё не добавлены.

- [ ] **Step 2: Добавить scripts**

Добавить:

```json
"typecheck": "tsc --noEmit",
"check:push": "bun run format:check && bun run lint && bun run typecheck && bun run test"
```

- [ ] **Step 3: Проверить scripts**

Run: `cd front && node -e "const pkg=require('./package.json'); console.log(pkg.scripts.typecheck); console.log(pkg.scripts['check:push'])"`
Expected: выводит обе команды.

- [ ] **Step 4: Commit**

```bash
git add front/package.json
git commit -m "chore: добавить проверки pre-push для frontend"
```

### Task 2: Добавить `check:push` для backend

**Files:**
- Modify: `api/package.json`

- [ ] **Step 1: Написать failing check на отсутствие script**

Run: `cd api && node -e "const pkg=require('./package.json'); if(!pkg.scripts['check:push']) process.exit(1)"`
Expected: FAIL.

- [ ] **Step 2: Добавить script**

Добавить:

```json
"check:push": "bun run format:check && bun run lint && bun run typecheck && bun run test"
```

- [ ] **Step 3: Проверить script**

Run: `cd api && node -e "const pkg=require('./package.json'); console.log(pkg.scripts['check:push'])"`
Expected: выводит команду.

- [ ] **Step 4: Commit**

```bash
git add api/package.json
git commit -m "chore: добавить проверки pre-push для backend"
```

## Chunk 2: Orchestration pre-push

### Task 3: Написать failing test/verification для diff logic

**Files:**
- Create: `scripts/pre-push-check.sh`

- [ ] **Step 1: Зафиксировать ожидаемое поведение в comments/examples**

В начале файла описать сценарии:

```sh
# docs-only -> skip
# api-only -> run backend
# front-only -> run frontend
# shared config -> run both
```

- [ ] **Step 2: Подготовить dry-run режим**

Сразу спроектировать env flag:

```sh
PRE_PUSH_DRY_RUN=1
```

Чтобы можно было проверить выбор команд без реального запуска.

- [ ] **Step 3: Запустить dry-run до реализации**

Run: `PRE_PUSH_DRY_RUN=1 bash scripts/pre-push-check.sh`
Expected: FAIL, потому что скрипта ещё нет или логика не реализована.

- [ ] **Step 4: Commit**

```bash
git add scripts/pre-push-check.sh
git commit -m "test: подготовить каркас pre-push quality gate"
```

### Task 4: Реализовать orchestration-скрипт

**Files:**
- Create: `scripts/pre-push-check.sh`

- [ ] **Step 1: Реализовать strict shell header**

```sh
#!/usr/bin/env bash
set -euo pipefail
```

- [ ] **Step 2: Определить base revision**

Логика:

```sh
UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"
if [ -n "$UPSTREAM" ]; then
  BASE_REF="$UPSTREAM"
else
  BASE_REF="$(git merge-base HEAD main 2>/dev/null || true)"
fi
```

- [ ] **Step 3: Собрать changed files**

```sh
CHANGED_FILES="$(git diff --name-only "${BASE_REF}"...HEAD)"
```

Если список пуст, завершать успешно.

- [ ] **Step 4: Определить флаги changed parts**

Флаги:

- `backend_changed`
- `frontend_changed`
- `docs_only`

Правила:

- `api/**` -> backend
- `front/**` -> frontend
- `.github/workflows/ci.yml`, `.husky/**`, `.lintstagedrc.js`, `package.json`, `scripts/**` -> both
- `docs/**`, `*.md` only -> skip

- [ ] **Step 5: Поддержать dry-run**

Если `PRE_PUSH_DRY_RUN=1`, печатать только:

```sh
Would run backend checks
Would run frontend checks
Docs-only change, skipping
```

- [ ] **Step 6: Реализовать реальные команды**

Для backend:

```sh
(cd api && bun run check:push)
```

Для frontend:

```sh
(cd front && bun run check:push)
```

- [ ] **Step 7: Запустить dry-run**

Run: `PRE_PUSH_DRY_RUN=1 bash scripts/pre-push-check.sh`
Expected: PASS и понятный вывод.

- [ ] **Step 8: Commit**

```bash
git add scripts/pre-push-check.sh
git commit -m "feat: добавить orchestration скрипт pre-push"
```

### Task 5: Подключить husky `pre-push`

**Files:**
- Create: `.husky/pre-push`

- [ ] **Step 1: Создать hook**

Содержимое:

```sh
bash scripts/pre-push-check.sh
```

- [ ] **Step 2: Сделать hook исполняемым**

Run: `chmod +x .husky/pre-push scripts/pre-push-check.sh`
Expected: PASS.

- [ ] **Step 3: Локально запустить hook напрямую**

Run: `.husky/pre-push`
Expected: выполняется orchestration-скрипт.

- [ ] **Step 4: Commit**

```bash
git add .husky/pre-push scripts/pre-push-check.sh
git commit -m "feat: подключить строгий pre-push hook"
```

## Chunk 3: Стабилизация pre-commit и CI

### Task 6: Проверить и упростить `lint-staged`, если он даёт лишнюю нестабильность

**Files:**
- Modify: `.lintstagedrc.js`

- [ ] **Step 1: Прочитать текущую конфигурацию**

Проверить:

- нет ли полного `npm run format` на весь проект для одного файла;
- нет ли лишнего дублирования между `api/**/*.ts` и `api/**/*.spec.ts`.

- [ ] **Step 2: Упростить только если это даёт явную ценность**

Например:

- не запускать полный backend `format` для одного staged-файла;
- не дублировать одинаковые backend handlers дважды.

- [ ] **Step 3: Проверить конфиг**

Run: `node -e "console.log(require('./.lintstagedrc.js'))"`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .lintstagedrc.js
git commit -m "chore: упростить локальные pre-commit проверки"
```

### Task 7: Выравнять CI с package scripts

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: Найти дублирование команд**

Сейчас CI вызывает:

- `bun run lint`
- `bun run typecheck`
- `bunx tsc --noEmit`
- `bun run format:check`

- [ ] **Step 2: Перевести frontend type-check на `bun run typecheck`**

Это уменьшит расхождение между CI и локальным pre-push.

- [ ] **Step 3: По возможности использовать `check:push` как composite local gate**

Минимальная версия:

- оставить matrix, но frontend type-check вызывать через script;
- при желании отдельным follow-up перевести и другие команды на общие scripts.

- [ ] **Step 4: Проверить YAML на синтаксическую целостность**

Run: `sed -n '1,220p' .github/workflows/ci.yml`
Expected: YAML читается корректно, команды не сломаны.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: выровнять локальные и ci проверки"
```

## Chunk 4: Верификация

### Task 8: Проверить package scripts напрямую

**Files:**
- Test: `api/package.json`
- Test: `front/package.json`

- [ ] **Step 1: Проверить backend scripts**

Run: `cd api && node -e "const pkg=require('./package.json'); console.log(pkg.scripts['check:push'])"`
Expected: script существует.

- [ ] **Step 2: Проверить frontend scripts**

Run: `cd front && node -e "const pkg=require('./package.json'); console.log(pkg.scripts.typecheck); console.log(pkg.scripts['check:push'])"`
Expected: scripts существуют.

- [ ] **Step 3: Проверить dry-run orchestration**

Run: `PRE_PUSH_DRY_RUN=1 bash scripts/pre-push-check.sh`
Expected: PASS.

- [ ] **Step 4: Проверить реальный запуск на текущем дереве**

Run: `bash scripts/pre-push-check.sh`
Expected: запускает нужный набор проверок и завершается успешно.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: проверить локальный quality gate перед push"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-pre-push-quality-gate.md`. Ready to execute?
