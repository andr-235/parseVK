# CI/CD And Release Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Привести GitHub Actions к схеме `push в main -> CI -> deploy + semantic-release`, убрать рекурсивные прогоны и сделать deploy привязанным к проверенному SHA.

**Architecture:** `CI` остаётся единственным quality gate для PR и `main`. `Deploy` и `Release` переходят на `workflow_run` от успешного `CI` и фильтруют только `push` в `main`; release-коммит с `[skip ci]` и SHA drift при deploy закрываются явными условиями и checkout конкретного коммита.

**Tech Stack:** GitHub Actions, semantic-release, JSON config, Bash, self-hosted runner, Bun/Node monorepo

---

## File Map

- Modify: `.github/workflows/ci.yml`
  - Главный quality gate; должен пропускать release-коммиты без downstream-эффектов.
- Modify: `.github/workflows/release.yml`
  - Автоматический релиз после успешного `CI` на `main`.
- Modify: `.github/workflows/deploy.yml`
  - Production deploy только для успешного `push`-CI на `main`, с checkout конкретного SHA.
- Modify: `.releaserc.json`
  - Единый release flow для root/api/front, tag format, commit message.
- Modify: `docs/CI_CD.md`
  - Документация фактической цепочки CI/CD.
- Reference: `docs/superpowers/specs/2026-03-13-ci-cd-release-design.md`
  - Источник требований и ограничений.

## Chunk 1: CI и release trigger logic

### Task 1: Закрыть повторный цикл на release-коммитах в CI

**Files:**
- Modify: `.github/workflows/ci.yml`
- Reference: `docs/superpowers/specs/2026-03-13-ci-cd-release-design.md`

- [ ] **Step 1: Зафиксировать текущие точки запуска CI**

Run: `grep -nE '^(on:|  pull_request:|  push:|jobs:)' .github/workflows/ci.yml`
Expected: видны текущие `pull_request` и `push` триггеры для `main`.

- [ ] **Step 2: Добавить явный guard для release-коммитов**

Изменить `.github/workflows/ci.yml`, чтобы workflow:

- продолжал запускаться на `pull_request` и `push` в `main`
- не запускал тяжёлые jobs для commit message вида `chore(release): ... [skip ci]`
- оставался валидным upstream для `workflow_run`

Минимальный ожидаемый подход:

```yaml
jobs:
  changes:
    if: github.event_name == 'pull_request' || !contains(github.event.head_commit.message, '[skip ci]')
```

Если guard требуется на уровне нескольких jobs, продублировать его явно, а не прятать в неочевидные expressions.

- [ ] **Step 3: Проверить, что release-коммит не пройдёт дальше changes job**

Run: `grep -n "skip ci" .github/workflows/ci.yml`
Expected: найден явный guard по `[skip ci]`.

- [ ] **Step 4: Проверить дифф на предмет побочных изменений**

Run: `git diff -- .github/workflows/ci.yml`
Expected: меняются только условия запуска и, при необходимости, описания job-level guards.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: исключить повторный запуск для release-коммитов"
```

### Task 2: Перевести release на workflow_run от CI

**Files:**
- Modify: `.github/workflows/release.yml`
- Modify: `.releaserc.json`
- Reference: `docs/superpowers/specs/2026-03-13-ci-cd-release-design.md`

- [ ] **Step 1: Зафиксировать текущее поведение release workflow**

Run: `sed -n '1,220p' .github/workflows/release.yml`
Expected: видно, что release сейчас срабатывает на `push` в `main` и `workflow_dispatch`.

- [ ] **Step 2: Перевести workflow на успешный CI для push в main**

Изменить `.github/workflows/release.yml` так, чтобы:

- trigger включал `workflow_run` по workflow `"CI"`
- сохранился `workflow_dispatch`
- job имел `if`, проверяющий:
  - `github.event_name == 'workflow_dispatch'`
  - или `workflow_run.conclusion == 'success'`
  - и `workflow_run.event == 'push'`
  - и `workflow_run.head_branch == 'main'`

Ожидаемый каркас:

```yaml
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
  workflow_dispatch:

jobs:
  release:
    if: >
      github.event_name == 'workflow_dispatch' ||
      (
        github.event.workflow_run.conclusion == 'success' &&
        github.event.workflow_run.event == 'push' &&
        github.event.workflow_run.head_branch == 'main'
      )
```

- [ ] **Step 3: Сделать checkout release на правильный SHA**

Если workflow запущен через `workflow_run`, checkout должен использовать:

```yaml
with:
  ref: ${{ github.event.workflow_run.head_sha }}
  fetch-depth: 0
```

Для `workflow_dispatch` допускается checkout по default branch.

- [ ] **Step 4: Уточнить `.releaserc.json`**

Проверить и при необходимости добавить:

- `tagFormat`: `v${version}`
- явное сохранение версий для:
  - `package.json`
  - `api/package.json`
  - `front/package.json`
- release commit message: `chore(release): ${nextRelease.version} [skip ci]`

Не добавлять npm publish или package registry integration, которых проект не использует.

- [ ] **Step 5: Проверить итоговый diff**

Run: `git diff -- .github/workflows/release.yml .releaserc.json`
Expected: release запускается только от успешного `CI` на `main` или вручную.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/release.yml .releaserc.json
git commit -m "ci: привязать релизы к успешному ci"
```

## Chunk 2: Детерминированный production deploy

### Task 3: Ограничить deploy только успешным push-CI на main

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Reference: `docs/superpowers/specs/2026-03-13-ci-cd-release-design.md`

- [ ] **Step 1: Зафиксировать текущие условия deploy workflow**

Run: `sed -n '1,260p' .github/workflows/deploy.yml`
Expected: видно `workflow_run` и текущее условие только по `conclusion == 'success'`.

- [ ] **Step 2: Добавить фильтрацию по типу исходного события**

Обновить `if` у job `deploy`, чтобы workflow шёл дальше только если:

- это `workflow_dispatch`
- или `workflow_run.conclusion == 'success'`
- и `workflow_run.event == 'push'`
- и `workflow_run.head_branch == 'main'`

Ожидаемый фрагмент:

```yaml
if: >
  github.event_name == 'workflow_dispatch' ||
  (
    github.event.workflow_run.conclusion == 'success' &&
    github.event.workflow_run.event == 'push' &&
    github.event.workflow_run.head_branch == 'main'
  )
```

- [ ] **Step 3: Исключить release-коммит из deploy path**

Добавить guard по commit message или actor, чтобы release-коммит `semantic-release` не создавал повторный production deploy.

Предпочтительно проверять commit message upstream SHA, если событие даёт его metadata; если нет, добавить ранний shell-step, который читает message у `head_sha` и выставляет output `skip_deploy=true`.

- [ ] **Step 4: Проверить локальный diff**

Run: `git diff -- .github/workflows/deploy.yml`
Expected: deploy больше не реагирует на PR-based CI и подготовлен к пропуску release-коммитов.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: ограничить прод-деплой успешными push в main"
```

### Task 4: Привязать deploy к проверенному SHA

**Files:**
- Modify: `.github/workflows/deploy.yml`
- Reference: `.github/scripts/log-helper.sh`

- [ ] **Step 1: Найти место, где deploy обновляет сервер до origin/main**

Run: `grep -nE 'git fetch origin|git reset --hard origin/main|git checkout' .github/workflows/deploy.yml`
Expected: найден блок `Update code`, который сейчас ориентируется на `origin/main`.

- [ ] **Step 2: Переписать update flow на конкретный SHA**

Изменить блок `Update code` так, чтобы для `workflow_run` использовался:

```bash
TARGET_SHA="${{ github.event.workflow_run.head_sha }}"
git fetch origin "$TARGET_SHA"
git checkout -f "$TARGET_SHA"
```

Если на сервере нужен локальный branch pointer для operational convenience, разрешено отдельно делать:

```bash
git branch -f deployed "$TARGET_SHA"
```

Но не возвращаться к `git reset --hard origin/main` как к источнику истины.

- [ ] **Step 3: Проверить, что шаги миграций и diff используют правильную базу**

Если логика миграций опирается на `HEAD~1`, привести её к более безопасному сравнению, например:

- использовать сохранённый previous deployed SHA, если он уже есть в metadata
- или явно документировать fallback поведение на первый deploy

Не оставлять скрытую зависимость от того, что `HEAD~1` всегда соответствует прошлому production deploy.

- [ ] **Step 4: Проверить diff**

Run: `git diff -- .github/workflows/deploy.yml`
Expected: деплой ориентируется на `workflow_run.head_sha`, а не на текущее состояние `origin/main`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: привязать деплой к проверенному commit sha"
```

## Chunk 3: Документация и верификация

### Task 5: Синхронизировать документацию CI/CD

**Files:**
- Modify: `docs/CI_CD.md`
- Reference: `docs/superpowers/specs/2026-03-13-ci-cd-release-design.md`
- Reference: `.github/workflows/ci.yml`
- Reference: `.github/workflows/deploy.yml`
- Reference: `.github/workflows/release.yml`

- [ ] **Step 1: Перечитать текущую документацию и финальные workflow**

Run: `sed -n '1,260p' docs/CI_CD.md`
Expected: зафиксированы места, где документ расходится с реальным поведением.

- [ ] **Step 2: Переписать разделы CI, Deploy и Release**

Документ должен явно описывать:

- `pull_request -> только CI`
- `push в main -> CI`
- после успешного `CI` на `main` запускаются:
  - production deploy
  - semantic-release
- release-коммит с `[skip ci]` не запускает повторный полный цикл

- [ ] **Step 3: Обновить troubleshooting под новую схему**

Проверить, что в документе есть ответы на:

- почему release не сработал
- почему deploy не пошёл после PR
- как понять, какой SHA ушёл в production

- [ ] **Step 4: Проверить diff**

Run: `git diff -- docs/CI_CD.md`
Expected: документация соответствует выбранной схеме и не описывает несуществующее поведение.

- [ ] **Step 5: Commit**

```bash
git add docs/CI_CD.md
git commit -m "docs: обновить описание ci cd и релизов"
```

### Task 6: Финальная верификация перед завершением

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `.releaserc.json`
- Modify: `docs/CI_CD.md`

- [ ] **Step 1: Проверить итоговый набор изменений**

Run: `git diff --stat`
Expected: изменены только workflow, release config и документация.

- [ ] **Step 2: Проверить отсутствие синтаксических артефактов**

Run: `git diff --check`
Expected: нет trailing whitespace, merge markers и битых hunks.

- [ ] **Step 3: Перечитать финальные workflow целиком**

Run: `sed -n '1,260p' .github/workflows/ci.yml && sed -n '1,320p' .github/workflows/deploy.yml && sed -n '1,260p' .github/workflows/release.yml`
Expected: условия запуска непротиворечивы:

- `CI` обрабатывает PR и `main`
- `Deploy` и `Release` зависят от успешного push-based `CI`
- release-коммит не создаёт новый цикл

- [ ] **Step 4: Проверить финальный release config**

Run: `sed -n '1,220p' .releaserc.json`
Expected: единая версия, tag format `v${version}`, changelog и package version bump сохранены.

- [ ] **Step 5: Зафиксировать итог**

```bash
git add .github/workflows/ci.yml .github/workflows/deploy.yml .github/workflows/release.yml .releaserc.json docs/CI_CD.md
git commit -m "ci: нормализовать пайплайн релизов и деплоя"
```
