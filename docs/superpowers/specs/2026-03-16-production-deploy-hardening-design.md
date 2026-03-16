# Дизайн: hardening production deploy и rollback контура

## Контекст

Production deploy и rollback в репозитории уже используют `docker-compose.deploy.yml` и GitHub Actions на self-hosted runner, но их поведение остаётся частично раздвоенным. Основные шаги дублируются в `.github/workflows/deploy.yml` и `.github/workflows/rollback.yml`, а сбои на уровне Docker build, pull базовых образов и миграций проявляются поздно и диагностируются неравномерно.

Текущий симптом: production deploy может зависать ещё на стадии загрузки metadata для базового образа `oven/bun:1`, то есть до Prisma, TypeScript и runtime-кода приложения. Это указывает не на прикладной дефект, а на недостаточно жёстко описанный production pipeline: сетевые проблемы, pull policy, build policy и retry logic смешаны с логикой самого деплоя.

## Цели

- Унифицировать production deploy и rollback вокруг одного набора shell-примитивов.
- Сделать build, migration и startup последовательность предсказуемой и диагностируемой.
- Выявлять сетевые и Docker-проблемы раньше, до долгой сборки.
- Снизить расхождения между deploy и rollback сценариями.
- Сохранить текущую модель production c локальными образами `parsevk-*:local`.

## Не цели

- Не менять локальный deploy и локальные compose-сценарии.
- Не переводить production на registry-first release model в этом проходе.
- Не менять бизнес-логику приложения.
- Не перестраивать сервисную архитектуру в `docker-compose.deploy.yml`.

## Подходы

### Вариант 1. Вынести production-логику в общие shell-скрипты

Deploy и rollback workflows становятся тонкими orchestration-обёртками, а общая логика уходит в `.github/scripts/production/*`.

Плюсы:

- Один источник правды для build, migrate, up, health-check и metadata.
- Проще вводить retry, timeout и preflight проверки.
- Проще тестировать и поддерживать, чем два больших YAML-файла.

Минусы:

- Появляется дополнительный слой shell-кода, который нужно держать небольшим и прозрачным.

### Вариант 2. Оставить всю логику в YAML, но нормализовать шаги

Deploy и rollback остаются в workflow-файлах, но получают одинаковую структуру и общее поведение.

Плюсы:

- Всё видно прямо в GitHub Actions.

Минусы:

- Дублирование останется.
- Любая будущая правка снова потребует синхронных изменений в двух workflow.

### Вариант 3. Перейти на prebuilt registry images

CI публикует production images, а production deploy/rollback только скачивает артефакты, запускает миграции и поднимает контейнеры.

Плюсы:

- Уходит класс проблем со сборкой на проде.

Минусы:

- Это уже изменение release model, а не точечный hardening текущего production контура.
- Scope задачи становится существенно шире.

## Выбранное решение

Использовать вариант `1`.

В этом проходе production deploy и rollback нормализуются через общий shell-слой, без перехода на новую модель поставки образов. Это даёт максимальный выигрыш по предсказуемости при умеренном масштабе изменений.

## Архитектура production контура

### Источник правды

Единственным compose-описанием production остаётся `docker-compose.deploy.yml`.

Единственным источником логики production lifecycle становятся небольшие shell-скрипты в `.github/scripts/production/`, вызываемые из workflow.

### Основная последовательность

Production pipeline нормализуется до одной цепочки:

1. `preflight`
2. `resolve target`
3. `prepare external images`
4. `build local application images`
5. `run migrations`
6. `release services`
7. `verify health`
8. `persist metadata`

Rollback использует те же примитивы, но с другим target commit и дополнительной schema compatibility проверкой.

## Компонентные границы

### `.github/workflows/deploy.yml`

Отвечает только за:

- выбор target commit;
- wiring входных параметров и outputs;
- вызов production shell-скриптов;
- публикацию итогового статуса job.

### `.github/workflows/rollback.yml`

Отвечает только за:

- выбор rollback target;
- schema compatibility gate;
- вызов тех же production shell-скриптов;
- публикацию rollback summary.

### `.github/scripts/production/preflight.sh`

Отвечает за ранние проверки:

- доступность `docker` и `docker compose`;
- наличие `.env` и обязательных переменных;
- доступность compose-конфига;
- проверку reachability к внешним registry, если pipeline собирает локальные images;
- валидацию внешних сетей и volumes, нужных production compose.

### `.github/scripts/production/images.sh`

Отвечает за:

- pre-pull внешних runtime images;
- pre-pull базовых build images;
- retry и timeout policy для `docker pull`;
- controlled build локальных images без скрытых побочных эффектов.

Ключевое правило: если base image недоступен, pipeline падает быстро на preflight/build preparation, а не через долгую зависшую сборку.

### `.github/scripts/production/migrations.sh`

Отвечает за:

- гарантированную доступность локального API image перед миграциями;
- запуск `prisma migrate deploy` без скрытой дополнительной сборки;
- сбор диагностических логов `api` и `db` при падении.

### `.github/scripts/production/release.sh`

Отвечает за:

- `docker compose up` с корректным режимом `build` vs `--no-build`;
- единое поведение для deploy и rollback;
- детерминированный сбор compose status/logs при ошибке.

### `.github/scripts/production/metadata.sh`

Отвечает за чтение и обновление `/opt/parseVK/.deployment-metadata.json`, чтобы deploy и rollback пользовались одной логикой и форматом.

## Build и image policy

### Локальные images

Production продолжает использовать:

- `parsevk-api:local`
- `parsevk-frontend:local`
- `parsevk-db-backup:local`

Но их подготовка становится формализованной: workflows не принимают решение о сборке ad hoc в нескольких местах, а пользуются общим production build helper.

### Внешние images

Для production hardening вводится явная подготовка внешних images:

- runtime images из compose;
- build-stage base images вроде `oven/bun:1`.

Если возможно без риска, external image references в production Dockerfiles/compose стоит закрепить более жёстко по tag или digest. Это опционально в этом проходе и делается только если не ломает rollback по historical commit.

## Ошибки и диагностика

Pipeline должен падать раньше и понятнее в следующих случаях:

- нет доступа к Docker Hub / GHCR;
- невалиден `docker-compose.deploy.yml`;
- отсутствует обязательная production environment variable;
- нет готового API image для миграций;
- миграции завершились ошибкой;
- контейнеры не вышли в healthy state.

Для каждого такого класса ошибок production scripts обязаны:

- печатать короткий понятный заголовок причины;
- собирать ограниченные, но релевантные логи;
- завершаться с ненулевым статусом без “молчаливого” продолжения.

## Ограничения текущего прохода

- refactor касается только production workflow и production shell-слоя;
- существующие локальные скрипты деплоя не трогаются;
- release model с публикацией versioned app images не внедряется;
- historical rollback path остаётся совместимым с checkout target commit.

## Тестирование и верификация

- Проверка, что `deploy.yml` и `rollback.yml` остаются валидными workflow.
- Проверка, что `docker compose -f docker-compose.deploy.yml config` проходит в production path.
- Smoke-проверка shell-скриптов на happy path и на ключевых fail-fast сценариях.
- Проверка, что deploy и rollback используют одинаковую build/migrate/up логику, где это допустимо.
- Проверка, что pipeline падает раньше при недоступном base image и явно сообщает причину.

## Риски

- Главный риск: вынесение логики в shell-слой может создать ещё один “теневой pipeline”, если скрипты станут слишком большими.
- Второй риск: слишком агрессивная нормализация может случайно сломать rollback для старых commit, если новый shell-слой будет предполагать наличие файлов, которых в historical revision ещё нет.
- Третий риск: жёсткое закрепление image references может улучшить стабильность build, но осложнить откат на старые commit, если делать это без совместимости.

## Итог

Production deploy и rollback переводятся на общий, небольшой и явный shell-слой. Workflows становятся тонкими orchestrator-файлами, а build, migration, startup и health-check получают единое поведение, ранние preflight проверки и предсказуемую диагностику. Это не устраняет внешние сетевые проблемы само по себе, но делает production pipeline устойчивее и существенно проще для сопровождения.
