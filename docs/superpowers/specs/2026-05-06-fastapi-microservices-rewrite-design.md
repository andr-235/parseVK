# FastAPI Microservices Rewrite Design

**Контекст**

Текущий проект содержит рабочий NestJS API в `api/`, frontend в `front/`, PostgreSQL, Redis, Docker Compose deploy и мониторинг. API уже обслуживает auth/users, VK parsing/tasks, Telegram/TGMBase, analytics, monitoring и вспомогательные модули.

Цель переписывания не состоит в переносе NestJS 1-в-1. Новый backend проектируется как микросервисная Python-платформа на FastAPI с Apache Kafka, отдельными сервисами, собственными БД и BFF/API Gateway для frontend. Текущий NestJS API должен оставаться рабочим до явного переключения.

## Цель первого этапа

Создать безопасную параллельную основу для новой backend-архитектуры:

- отдельная git-ветка для работ по переписыванию;
- `api-gateway` как публичный BFF для frontend;
- `identity-service` как внутренний сервис auth/users;
- общий Python package для инфраструктурных контрактов;
- Apache Kafka в KRaft mode;
- отдельная БД для `identity-service`;
- frontend auth flow через gateway;
- NestJS API остаётся доступным как рабочий fallback.

Первый этап считается готовым, когда через gateway проходит полный сценарий auth: seed admin -> login -> refresh -> me -> change password -> logout, а `identity-service` публикует события в Kafka.

## Архитектурный подход

Рекомендуемый подход: параллельная микросервисная платформа рядом с текущим NestJS API.

Рассматривались альтернативы:

- заменить `api/` сразу внутри текущего сервиса;
- сделать один FastAPI modular monolith и позже дробить на сервисы;
- поднять gateway как тонкий reverse proxy без собственных контрактов.

Эти варианты хуже соответствуют выбранному направлению. Сразу заменять `api/` рискованно для рабочего deploy. Modular monolith проще, но не учитывает требование сразу проектировать под микросервисы с Kafka. Тонкий proxy быстро привязывает frontend к внутренним контрактам сервисов. Поэтому gateway должен быть полноценным BFF с собственными DTO, middleware и error mapping.

## Целевая структура

Новые Python-компоненты добавляются рядом с существующим кодом:

```text
services/
  api-gateway/
    app/
      main.py
      core/
      modules/auth/
      clients/identity.py
      tests/
  identity-service/
    app/
      main.py
      core/
      db/
      modules/auth/
      modules/users/
      modules/outbox/
      tests/
    alembic/
libs/
  py/
    common/
      pyproject.toml
      common/
        errors.py
        events.py
        logging.py
        request_id.py
        security.py
```

Эти имена каталогов являются целевыми для первого implementation plan. Границы ответственности:

- `api-gateway` содержит публичный frontend API и не хранит пользователей;
- `identity-service` владеет auth/users, JWT issuance, refresh token hash и своей БД;
- `libs/py/common` содержит только инфраструктурные контракты, без бизнес-моделей.

## Сервисы

### API Gateway

`api-gateway` является единственной публичной точкой входа для frontend.

Обязанности:

- публичный REST API `/api/v1/...`;
- CORS и cookie policy;
- request-id/correlation-id;
- единый формат ошибок;
- rate limiting для auth endpoints;
- проверка access token по public key/JWKS;
- установка и удаление refresh cookie;
- вызовы внутренних сервисов через typed HTTP clients;
- преобразование внутренних ответов сервисов в frontend DTO.

Gateway не выпускает JWT и не хранит refresh token. Он получает refresh token от `identity-service` во внутреннем ответе и ставит его в `httpOnly` cookie.

### Identity Service

`identity-service` является внутренним FastAPI-сервисом.

Обязанности:

- пользователи и роли;
- password hashing;
- login;
- refresh;
- logout/invalidate refresh token;
- change password;
- JWT issuance;
- JWKS/public key endpoint для gateway;
- admin seed из env;
- Alembic migrations;
- outbox и публикация identity-событий в Kafka.

Существующих пользователей NestJS не мигрируем. Первый admin создаётся из env при seed/migration startup.

### Будущие сервисы

Первый этап готовит платформу для следующих доменных сервисов:

- `vk-service` для VK crawling/parsing;
- `tasks-service` для задач и фоновой обработки;
- `telegram-service` для Telegram/TGMBase;
- `analytics-service` для read models и агрегатов.

Они не входят в первый implementation plan, кроме архитектурного учёта через gateway, Kafka event envelope и раздельные БД.

## Данные и миграции

`identity-service` использует отдельную БД, например `parsevk_identity`. Это изолирует новую auth-схему от текущей Prisma-схемы NestJS.

Стек:

- SQLAlchemy 2;
- Alembic;
- async PostgreSQL driver;
- Pydantic v2;
- pytest.

Минимальные таблицы первого этапа:

- `users`;
- `refresh_tokens`;
- `outbox_events`;
- `alembic_version`.

Refresh-сессии сразу проектируются как multi-session: один пользователь может иметь несколько активных refresh tokens для разных браузеров/устройств. Logout инвалидирует текущий refresh token, а будущая админская операция сможет инвалидировать все сессии пользователя.

## Auth и JWT

JWT выпускает только `identity-service`.

Подпись:

- RS256;
- private key доступен только `identity-service`;
- public key/JWKS доступен gateway и будущим сервисам;
- private key не хранится в git, передаётся через env или mounted secret file.

Frontend session flow:

1. `POST /api/v1/auth/login`
   - frontend отправляет username/password в gateway;
   - gateway вызывает `identity-service`;
   - identity возвращает access token, refresh token и user;
   - gateway возвращает frontend access token и user;
   - gateway ставит refresh token в `httpOnly` cookie.

2. `POST /api/v1/auth/refresh`
   - frontend не передаёт refresh token явно;
   - gateway читает refresh cookie;
   - gateway вызывает identity;
   - identity проверяет refresh token hash и выпускает новые токены;
   - gateway обновляет cookie и возвращает новый access token.

3. `POST /api/v1/auth/logout`
   - gateway читает refresh cookie;
   - identity инвалидирует refresh token;
   - gateway удаляет cookie.

4. `GET /api/v1/auth/me`
   - gateway валидирует access token;
   - при необходимости запрашивает актуального пользователя в identity;
   - возвращает frontend DTO пользователя.

5. `POST /api/v1/auth/change-password`
   - gateway валидирует access token;
   - identity проверяет старый пароль, сохраняет новый hash, ротирует refresh token.

Access token хранится в памяти frontend. Refresh token хранится только в `httpOnly` cookie.

## Kafka

Используется Apache Kafka в KRaft mode без ZooKeeper.

Kafka должна работать уже в первом этапе. `identity-service` публикует события:

- `identity.user_created`;
- `identity.user_logged_in`;
- `identity.password_changed`;
- `identity.user_logged_out`.

Публикация идёт через outbox-паттерн:

1. доменная операция сохраняет изменения в БД;
2. в той же транзакции создаётся запись `outbox_events`;
3. отдельный publisher читает pending events;
4. publisher отправляет событие в Kafka;
5. после успешной отправки событие помечается как published.

Это снижает риск потери события при сбое между commit БД и Kafka publish.

Общий event envelope живёт в `libs/py/common` и содержит:

- `event_id`;
- `event_type`;
- `event_version`;
- `occurred_at`;
- `producer`;
- `correlation_id`;
- `payload`.

## Frontend

Frontend на первом этапе меняется только в auth-срезе.

Требования:

- auth-клиент ходит в gateway;
- refresh token больше не хранится в localStorage/sessionStorage;
- access token хранится в памяти приложения;
- восстановление сессии после reload идёт через `/api/v1/auth/refresh`;
- logout вызывает gateway и очищает локальное состояние;
- остальные доменные экраны могут временно продолжать использовать текущий NestJS API до переноса соответствующих сервисов.

Целевой публичный путь для нового backend — только через gateway.

## Docker и deploy

Compose получает новые сервисы:

- `api-gateway`;
- `identity-service`;
- `identity-db`;
- `kafka`;
- migration/seed job для identity, если это удобнее entrypoint.

Текущий NestJS `api` остаётся в compose и не удаляется на первом этапе.

Healthchecks:

- `api-gateway`: `/health`;
- `identity-service`: `/health`;
- Kafka: broker readiness check;
- identity DB: PostgreSQL readiness.

Gateway публикуется для frontend. `identity-service` остаётся внутренним сервисом compose network.

## Ошибки и наблюдаемость

Все новые сервисы используют единый формат ошибок из `libs/py/common`.

Минимальные требования:

- request-id на входе gateway;
- correlation-id прокидывается в identity и Kafka events;
- structured JSON logs;
- понятные 401/403/422/500 ответы;
- health endpoint без доступа к секретам;
- секреты не логируются.

## Тестирование

Первый этап должен покрываться:

- unit-тестами password hashing, JWT issuance, refresh validation;
- unit-тестами event envelope и outbox state transitions;
- integration-тестами identity API с тестовой БД;
- integration-тестами gateway auth flow через test client и mocked/internal identity client или поднятый test service;
- Kafka smoke test для publish path;
- frontend tests для login/session restore/logout;
- Docker smoke: поднять gateway, identity, Kafka, DB и пройти login -> refresh -> me -> logout.

Если Kafka или Docker недоступны локально, обязательна отдельная проверка контрактов unit/integration уровня и явная пометка, что full compose smoke не запускался.

## Границы первого этапа

Входит:

- новая Python workspace структура;
- gateway;
- identity-service;
- common Python package;
- Kafka в compose;
- identity DB и Alembic;
- admin seed из env;
- auth/users endpoints;
- frontend auth integration;
- базовые тесты и smoke commands.

Не входит:

- перенос VK parsing/tasks;
- перенос Telegram/TGMBase;
- перенос analytics/monitoring;
- миграция существующих NestJS-пользователей;
- полное отключение NestJS API;
- production switch без отдельного решения.

## Критерии готовности

Первый этап готов, когда:

- новая ветка содержит spec и implementation plan;
- `api-gateway` и `identity-service` запускаются локально;
- Alembic создаёт identity schema;
- admin создаётся из env;
- frontend может войти через gateway;
- refresh cookie работает без хранения refresh token в JS;
- logout удаляет cookie и инвалидирует refresh token;
- `identity-service` публикует Kafka events через outbox;
- NestJS API остаётся рабочим и не затронутым;
- релевантные backend/frontend тесты проходят или их ограничения явно описаны.
