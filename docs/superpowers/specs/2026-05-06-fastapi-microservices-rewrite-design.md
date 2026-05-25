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

Первый этап не реализуется одним большим pull request. Он нарезается на маленькие implementation units:

1. `PR-001`: FastAPI workspace skeleton, tooling, common package.
2. `PR-002`: `identity-service` DB, Alembic migrations, idempotent admin seed command.
3. `PR-003`: `identity-service` auth core: login, refresh, me, change-password, logout.
4. `PR-004`: `api-gateway` auth BFF, cookies, CSRF, JWKS validation.
5. `PR-005`: outbox, Kafka publish path, retry/idempotency.
6. `PR-006`: frontend auth switch to gateway.
7. `PR-007`: Docker smoke, tests, docs.

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
        config.py
        logging.py
        middleware.py
        security.py
      modules/auth/
        router.py
        schemas.py
        service.py
      clients/
        identity/
          client.py
          schemas.py
      tests/
  identity-service/
    app/
      main.py
      core/
        config.py
        security.py
        jwt.py
      db/
        base.py
        session.py
        models.py
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
        pagination.py
        security.py
```

Эти имена каталогов являются целевыми для первого implementation plan. Границы ответственности:

- `api-gateway` содержит публичный frontend API и не хранит пользователей;
- `identity-service` владеет auth/users, JWT issuance, refresh token hash и своей БД;
- `libs/py/common` содержит только инфраструктурные контракты, без бизнес-моделей.

В `libs/py/common` нельзя выносить бизнес-модели вроде `User`, `Role`, `VKTask`, `TelegramMessage`. Общий пакет ограничивается error envelope, event envelope, request/correlation id, logging helpers, security primitives, базовыми DTO и constants для headers.

## Сервисы

### API Gateway

`api-gateway` является единственной публичной точкой входа для frontend.

Обязанности:

- публичный REST API `/api/v1/...`;
- CORS и cookie policy;
- CSRF protection для cookie-based auth;
- request-id/correlation-id;
- единый формат ошибок;
- rate limiting для auth endpoints;
- проверка access token по public key/JWKS;
- установка и удаление refresh cookie;
- вызовы внутренних сервисов через typed HTTP clients;
- преобразование внутренних ответов сервисов в frontend DTO.

Gateway не выпускает JWT и не хранит refresh token. Он получает refresh token от `identity-service` во внутреннем ответе и ставит его в `httpOnly` cookie.

Gateway не должен превращаться во второй auth-service. В нём не должно быть password hashing, refresh token storage, user persistence, JWT issuance и бизнес-логики identity.

Для `/me` gateway валидирует access token и запрашивает актуального пользователя в `identity-service`, чтобы учитывать `is_active`, изменения ролей и `password_changed_at`.

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
- idempotent admin seed command из env;
- Alembic migrations;
- outbox и публикация identity-событий в Kafka.

Существующих пользователей NestJS не мигрируем. Первый admin создаётся из env только отдельной идемпотентной CLI-командой после применения миграций.

Password hashing:

- основной алгоритм: Argon2id;
- bcrypt допускается только как fallback, если Argon2id недоступен;
- password hash хранится только в identity DB;
- plain password и password hash никогда не логируются.

Internal endpoints `identity-service` не публикуются наружу, доступны только внутри compose network и требуют service-to-service header с internal token. Gateway прокидывает `X-Request-ID`, `X-Correlation-ID` и идентификатор caller service. mTLS оставляется для отдельного production-hardening этапа.

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

`users`:

- `id UUID PK`;
- `username CITEXT UNIQUE`;
- `email CITEXT UNIQUE NULL`;
- `password_hash TEXT`;
- `role TEXT`;
- `is_active BOOLEAN`;
- `is_superuser BOOLEAN`;
- `password_changed_at TIMESTAMPTZ`;
- `created_at TIMESTAMPTZ`;
- `updated_at TIMESTAMPTZ`.

`refresh_tokens`:

- `id UUID PK`;
- `user_id UUID FK`;
- `token_hash TEXT UNIQUE`;
- `token_family_id UUID`;
- `replaced_by_token_id UUID NULL`;
- `revoked_at TIMESTAMPTZ NULL`;
- `expires_at TIMESTAMPTZ`;
- `last_used_at TIMESTAMPTZ NULL`;
- `created_at TIMESTAMPTZ`;
- `user_agent_hash TEXT NULL`;
- `ip_hash TEXT NULL`.

`outbox_events`:

- `id UUID PK`;
- `event_type TEXT`;
- `event_version INT`;
- `aggregate_type TEXT`;
- `aggregate_id TEXT`;
- `correlation_id TEXT`;
- `payload JSONB`;
- `status TEXT`;
- `attempts INT`;
- `next_attempt_at TIMESTAMPTZ`;
- `locked_at TIMESTAMPTZ NULL`;
- `published_at TIMESTAMPTZ NULL`;
- `last_error TEXT NULL`;
- `created_at TIMESTAMPTZ`.

`alembic_version` создаётся Alembic.

Refresh-сессии сразу проектируются как multi-session: один пользователь может иметь несколько активных refresh tokens для разных браузеров/устройств. Logout инвалидирует текущий refresh token, а будущая админская операция сможет инвалидировать все сессии пользователя.

Plaintext refresh token в БД не хранится. Хранится только hash.

Async SQLAlchemy rule:

- один `AsyncSession` на request/job;
- session не хранится глобально;
- `AsyncSession` не шарится между concurrent tasks;
- outbox publisher и background jobs получают собственный session scope.

Alembic и seed разделяются:

```bash
alembic upgrade head
python -m app.cli seed-admin
```

Миграции меняют схему. Admin seed является отдельной идемпотентной CLI-командой, которая создаёт первого администратора из env только если он ещё не существует.

## Auth и JWT

JWT выпускает только `identity-service`.

Подпись:

- RS256;
- private key доступен только `identity-service`;
- public key/JWKS доступен gateway и будущим сервисам;
- private key не хранится в git, передаётся через env или mounted secret file.

Access token profile:

- алгоритм только `RS256`;
- обязательные claims: `iss`, `aud`, `sub`, `jti`, `iat`, `nbf`, `exp`, `typ`;
- `typ` должен быть `access`;
- `roles` содержит роли пользователя;
- `iss` по умолчанию `identity-service`;
- `aud` по умолчанию `api-gateway`;
- lifetime: 5-15 минут.

Gateway валидирует:

- signature;
- `alg == RS256`;
- `kid` существует в JWKS;
- `iss`;
- `aud`;
- `exp`;
- `nbf`;
- `typ == access`.

Refresh token:

- opaque random token, не JWT;
- хранится в БД только как hash;
- lifetime: 7-30 дней;
- inactivity timeout: 7 дней по умолчанию;
- ротируется на каждый refresh;
- token family отслеживается через `token_family_id`;
- reuse старого refresh token считается replay-атакой;
- reuse инвалидирует всю token family;
- password change инвалидирует все предыдущие refresh-сессии пользователя.

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

Production refresh cookie:

- name: `__Host-refresh_token`;
- `HttpOnly`;
- `Secure`;
- `SameSite=Lax` или `SameSite=Strict`;
- `Path=/`;
- без `Domain`;
- frontend никогда не читает refresh token напрямую.

Для local/dev допускается `REFRESH_COOKIE_SECURE=false`, но production всегда требует `Secure=true`.

CSRF protection для state-changing auth endpoints:

- SameSite cookie;
- Origin/Referer validation;
- CSRF header или double-submit token;
- применяется минимум к `/auth/refresh`, `/auth/logout`, `/auth/change-password`.

Rate limiting auth endpoints:

- `POST /auth/login`: limit by IP и username, progressive delay, одинаковая ошибка для wrong username/password;
- `POST /auth/refresh`: limit by token family и IP;
- `POST /auth/change-password`: old password обязателен, событие пишется в audit/security log без чувствительных данных.

## Kafka

Используется Apache Kafka в KRaft mode без ZooKeeper.

Для local/dev Compose используется single-node combined mode:

```text
process.roles=broker,controller
```

Этот режим не считается production topology. Production Kafka topology описывается отдельно перед реальным переключением.

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

Outbox publisher:

- читает batch pending events;
- использует row locking `FOR UPDATE SKIP LOCKED`;
- Kafka key = `aggregate_id` или `user_id`;
- `event_id` всегда UUID;
- consumers должны быть idempotent по `event_id`;
- retry с backoff;
- max attempts;
- failed/dead-letter state;
- `published_at` выставляется только после успешного ack от Kafka.

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

Frontend lifecycle:

1. приложение стартует без access token;
2. вызывает `POST /api/v1/auth/refresh` with credentials;
3. если ответ `200`, сохраняет access token в memory store;
4. если ответ `401`, считает пользователя anonymous;
5. остальные API calls ждут завершения session restore.

`credentials: "include"` используется аккуратно для gateway auth endpoints и не должен приводить к отправке cookies на сторонние домены.

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

Никогда не логируются:

- access token;
- refresh token;
- password;
- password hash;
- private key;
- `Authorization` header;
- `Set-Cookie` header.

## Тестирование

Первый этап должен покрываться:

- unit-тестами password hashing, JWT issuance, refresh validation;
- unit-тестами event envelope и outbox state transitions;
- integration-тестами identity API с тестовой БД;
- integration-тестами gateway auth flow через test client и mocked/internal identity client или поднятый test service;
- Kafka smoke test для publish path;
- frontend tests для login/session restore/logout;
- Docker smoke: поднять gateway, identity, Kafka, DB и пройти login -> refresh -> me -> logout.

Contract tests:

- gateway <-> identity request/response schemas;
- event envelope schema;
- public frontend API DTO snapshot;
- OpenAPI generation check.

Security tests:

- expired access token -> 401;
- wrong `aud` -> 401;
- wrong `iss` -> 401;
- refresh reuse -> revoke family;
- logout twice -> idempotent response;
- inactive user cannot refresh;
- password change invalidates old sessions.

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
