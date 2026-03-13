# Дизайн: нормализация CI/CD и автоматических релизов

Дата: 2026-03-13
Статус: утверждено

## Контекст

В репозитории уже есть workflow для CI, деплоя, релизов, security и rollback:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/release.yml`
- `.github/workflows/security.yml`
- `.github/workflows/rollback.yml`

Также есть конфигурация semantic-release в `.releaserc.json`.

Проблема не в отсутствии CI/CD, а в рассинхроне между фактическим поведением workflow, документацией и целевой моделью релизов. Пользователь подтвердил следующие требования:

- авто-релиз через semantic-release
- деплой в production на каждый push в `main`
- единая версия на весь монорепозиторий
- semantic-release обновляет `CHANGELOG.md` и версии в `package.json`

## Цели

- Сделать `CI` единым quality gate для `pull_request` и `push` в `main`.
- Сохранить деплой production на каждый успешный push в `main`.
- Настроить автоматическое создание релизов, git tag и GitHub Release через semantic-release.
- Синхронизировать версию в:
  - `package.json`
  - `api/package.json`
  - `front/package.json`
  - `CHANGELOG.md`
- Исключить рекурсивные или лишние прогоны после release-коммита.
- Привести документацию в соответствие реальному поведению.

## Не-цели

- Переход на отдельные версии для `api` и `front`
- Перевод production deploy на релизные теги
- Переписывание deploy-логики на другой инструмент
- Изменение rollback/security workflow, если это не требуется для новой схемы

## Выбранный подход

Выбран подход "нормализованная схема вокруг main":

- `CI` запускается на `pull_request` и `push` в `main`
- `Deploy` запускается после успешного `CI` только для `push` в `main`
- `Release` запускается после успешного `CI` только для `push` в `main`
- `semantic-release` рассчитывает новую версию по conventional commits, обновляет changelog и package versions, создаёт release-коммит, тег и GitHub Release
- release-коммит не должен инициировать повторный полный цикл CI/deploy/release

Этот подход выбран потому, что он совпадает с требуемой моделью пользователя и требует минимального архитектурного вмешательства в существующий репозиторий.

## Рассмотренные альтернативы

### 1. Минимальная починка текущей схемы

Оставить существующие workflow почти без изменений и исправить только отдельные баги.

Плюсы:

- минимальный объём правок
- быстрый результат

Минусы:

- сохраняются неявные связи между CI, deploy и release
- выше риск гонок между deploy и release-коммитом
- документация и процессы остаются хрупкими

### 2. Release-driven deploy

Сначала создавать тег и релиз, а production деплоить только по тегу.

Плюсы:

- архитектурно чище
- проще связывать production с релизной версией

Минусы:

- противоречит выбранному требованию деплоя на каждый push в `main`
- требует большей перестройки текущего CD

## Целевая архитектура

### 1. CI

`CI` остаётся главным workflow проверки качества:

- триггеры:
  - `pull_request` в `main`
  - `push` в `main`
- проверяет:
  - lint
  - type-check
  - format-check
  - backend tests
  - frontend tests

Дополнительно:

- release-коммиты должны быть пропущены или завершаться без downstream-эффектов
- `CI` должен быть надёжным upstream-событием для `workflow_run`

### 2. Deploy

`Deploy` запускается после успешного `CI`, но только когда завершившийся `CI` был вызван `push` в `main`.

Ключевые требования:

- не запускаться после PR-проверок
- не запускаться после release-коммита semantic-release
- деплоить именно тот SHA, который прошёл `CI`

Последний пункт критичен: текущая реализация обновляет `/opt/parseVK` до `origin/main` на момент выполнения, что может привести к деплою коммита, который не проходил данный конкретный `CI`.

### 3. Release

`Release` запускается после успешного `CI` для `push` в `main`.

Обязанности:

- вычислить следующую версию по conventional commits
- обновить `CHANGELOG.md`
- обновить:
  - корневой `package.json`
  - `api/package.json`
  - `front/package.json`
- создать release-коммит с `[skip ci]`
- создать git tag формата `vX.Y.Z`
- создать GitHub Release

### 4. Versioning

Versioning единый для всего монорепозитория:

- одна версия на весь репозиторий
- один changelog
- один git tag
- один GitHub Release

Это соответствует текущей структуре поставки и упрощает release automation.

## Изменения по файлам

### `.github/workflows/ci.yml`

Нужно:

- добавить защиту от повторной обработки release-коммитов
- убедиться, что workflow корректно различает `pull_request` и `push`
- оставить CI сфокусированным на проверках качества

### `.github/workflows/deploy.yml`

Нужно:

- фильтровать запуск только для `workflow_run` от успешного `CI` после `push` в `main`
- исключить release-коммиты
- использовать SHA из `workflow_run`, а не просто `origin/main`

### `.github/workflows/release.yml`

Нужно:

- запускать release после успешного `CI`, а не на любой push в `main`
- оставить `workflow_dispatch` как fallback
- защититься от рекурсии на release-коммитах

### `.releaserc.json`

Нужно:

- сохранить единый version bump для root/api/front
- при необходимости уточнить:
  - `branches`
  - `tagFormat`
  - release rules
- проверить, что плагины не делают лишних действий, не нужных проекту

### `docs/CI_CD.md`

Нужно:

- переписать под реальное поведение workflow
- описать цепочку:
  - `push` в `main`
  - `CI`
  - `deploy`
  - `release`
- явно указать, что release-коммит не вызывает повторный полный цикл

## Риски и edge cases

### 1. Drift между CI и deploy

Если deploy продолжит брать "текущий `origin/main`", production может получить более новый коммит, чем тот, который прошёл CI. Это недопустимо.

Митигировать:

- фиксировать SHA из `github.event.workflow_run.head_sha`
- деплоить именно этот коммит на сервере

### 2. Рекурсивный запуск после release-коммита

Если release-коммит с `[skip ci]` будет обрабатываться как обычный push, возможны:

- лишний CI
- лишний deploy
- лишний release workflow

Митигировать:

- добавить явные условия пропуска в workflow
- не полагаться только на текст commit message там, где можно использовать условия по событию и actor

### 3. Расхождение документации и поведения

Если не обновить документацию, сопровождение пайплайна останется дорогим и ошибкоопасным.

Митигировать:

- обновить `docs/CI_CD.md` вместе с workflow

## Тестирование и верификация

После реализации нужно проверить:

- workflow syntax и conditions
- сценарий `pull_request -> только CI`
- сценарий `push в main -> CI + deploy + release`
- сценарий release-коммита -> нет повторного полного цикла
- корректность обновления `CHANGELOG.md` и всех `package.json`
- корректность создания тега и GitHub Release

Минимальная локальная верификация:

- проверка YAML и JSON на синтаксис
- проверка условий запуска по содержимому workflow
- dry-run semantic-release, если окружение позволяет

## Критерии готовности

- `CI` стабильно работает на PR и push в `main`
- `Deploy` срабатывает только для успешного `push`-CI на `main`
- `Deploy` использует проверенный SHA
- `Release` автоматически создаёт новую версию, тег и GitHub Release
- `CHANGELOG.md`, `package.json`, `api/package.json`, `front/package.json` синхронизированы
- release-коммит не запускает повторный полный цикл
- `docs/CI_CD.md` соответствует реальному поведению

## Открытые допущения

- ветка релизов остаётся `main`
- conventional commits уже используются или будут использоваться последовательно
- GitHub Actions runner и permissions позволяют semantic-release создавать теги и releases
- production deploy продолжает работать на self-hosted runner без смены инфраструктуры
