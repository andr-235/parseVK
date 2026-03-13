# CI/CD Pipeline Documentation

## Обзор

Проект использует GitHub Actions для автоматизации проверки кода, production deploy и автоматических релизов.

Актуальная цепочка для основной ветки:

1. `pull_request` в `main` запускает только `CI`
2. `push` в `main` запускает `CI`
3. После успешного `CI` для push в `main` параллельно запускаются:
   - `Deploy to Production Server`
   - `Release`
4. `semantic-release` создаёт release-коммит с `[skip ci]`, git tag `vX.Y.Z` и GitHub Release
5. Release-коммит не запускает повторный полный цикл

## Workflow: CI

**Файл:** `.github/workflows/ci.yml`

**Триггеры:**

- Pull Request в `main`
- Push в `main`

**Назначение:**

- проверить качество изменений до merge
- быть единым quality gate для downstream workflow

**Jobs:**

1. `changes` - определяет, изменились ли backend и frontend
2. `code-quality` - запускает `lint`, `typecheck`, `format-check`
3. `test-backend` - запускает backend тесты с PostgreSQL и Redis
4. `test-frontend` - запускает frontend тесты

**Особенности:**

- backend и frontend проверки запускаются только при релевантных изменениях
- зависимости ставятся через Bun
- для backend генерируется Prisma Client
- release-коммит `chore(release): ... [skip ci]` не запускает тяжёлые jobs

## Workflow: Deploy

**Файл:** `.github/workflows/deploy.yml`

**Триггеры:**

- `workflow_run` после завершения `CI`
- ручной запуск `workflow_dispatch`

**Когда deploy реально выполняется автоматически:**

- исходный `CI` завершился со статусом `success`
- этот `CI` был вызван событием `push`
- push пришёл в ветку `main`
- целевой commit не является release-коммитом с `[skip ci]`

**Что делает deploy:**

1. Загружает metadata предыдущего успешного деплоя из `/opt/parseVK/.deployment-metadata.json`
2. Определяет целевой commit SHA из `github.event.workflow_run.head_sha`
3. Checkout'ит на сервере именно этот commit, а не просто текущий `origin/main`
4. Сравнивает текущий commit с `last_successful_commit` и решает, нужны ли миграции
5. При необходимости поднимает зависимости и запускает миграции
6. Собирает и поднимает контейнеры через `docker compose`
7. Обновляет deployment metadata после успешного деплоя

**Почему это важно:**

- production получает именно тот commit, который прошёл `CI`
- release-коммит не провоцирует лишний deploy
- rollback опирается на актуальный `last_successful_commit`

## Workflow: Release

**Файл:** `.github/workflows/release.yml`

**Триггеры:**

- `workflow_run` после успешного `CI`
- ручной запуск `workflow_dispatch`

**Когда release реально выполняется автоматически:**

- исходный `CI` завершился успешно
- этот `CI` был вызван `push` в `main`

**Что делает release:**

1. Checkout'ит commit, прошедший `CI`
2. Запускает `semantic-release`
3. Вычисляет следующую версию по conventional commits
4. Обновляет:
   - `CHANGELOG.md`
   - `package.json`
   - `api/package.json`
   - `front/package.json`
5. Создаёт release-коммит `chore(release): X.Y.Z [skip ci]`
6. Создаёт git tag формата `vX.Y.Z`
7. Создаёт GitHub Release

## Semantic Release Configuration

**Файл:** `.releaserc.json`

Текущая конфигурация:

- релизы идут только из ветки `main`
- тег создаётся в формате `v${version}`
- changelog обновляется автоматически
- корневой, backend и frontend `package.json` синхронизируются по версии
- публикация в npm отключена

## Workflow: Security

**Файл:** `.github/workflows/security.yml`

**Триггеры:**

- Pull Request в `main`
- Push в `main`
- schedule

**Назначение:**

- dependency scan
- Docker image scan
- secret scan

## Workflow: Rollback

**Файл:** `.github/workflows/rollback.yml`

**Триггеры:**

- ручной запуск `workflow_dispatch`

**Источник данных для rollback:**

- `/opt/parseVK/.deployment-metadata.json`

**Используется для:**

- определения последнего успешного production commit
- отката на указанный commit или на последний успешный deploy

## Метаданные деплоя

Файл metadata:

- `/opt/parseVK/.deployment-metadata.json`

После успешного production deploy в нём поддерживаются:

- `last_successful_commit`
- `last_successful_deploy_time`

Это используется:

- в production deploy для сравнения изменений перед миграциями
- в rollback workflow для выбора commit по умолчанию

## Dependabot

**Файл:** `.github/dependabot.yml`

Настроены автоматические обновления:

- npm зависимостей
- Docker образов
- GitHub Actions

## Troubleshooting

### Почему CI не запускает тяжёлые jobs

Проверь commit message. Если это release-коммит с `[skip ci]`, workflow intentionally не идёт дальше `changes`.

### Почему deploy не пошёл после PR

Это ожидаемое поведение. Автоматический deploy выполняется только после успешного `CI`, вызванного `push` в `main`.

### Почему release не создался

Проверь:

- завершился ли `CI` успешно
- был ли upstream event именно `push` в `main`
- есть ли новые conventional commits, требующие релиза
- хватает ли прав у `GITHUB_TOKEN` на создание commit/tag/release

### Как понять, какой commit ушёл в production

Смотри:

- лог job `Deploy to Debian Server`
- значение `github.event.workflow_run.head_sha`
- файл `/opt/parseVK/.deployment-metadata.json`

### Почему миграции не запустились

Deploy сравнивает текущий commit с `last_successful_commit`. Если в diff нет изменений в `api/` или Prisma-файлах, миграции пропускаются.
