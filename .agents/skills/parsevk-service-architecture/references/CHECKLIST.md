# parseVK Service Architecture Checklist

## Service Structure

- [ ] `services/{name}/` существует
- [ ] `app/` — основной пакет
- [ ] `app/__init__.py` — пустой или минимальный
- [ ] `app/main.py` — `create_app()` factory
- [ ] `app/core/config.py` — pydantic-settings с префиксом
- [ ] `app/core/security.py` — `require_internal_token`
- [ ] `app/db/base.py` — `DeclarativeBase`
- [ ] `app/db/session.py` — `engine`, `SessionLocal`, `get_session`
- [ ] `app/db/models.py` — ORM модели
- [ ] `app/modules/{module}/router.py` — APIRouter
- [ ] `app/modules/{module}/service.py` — бизнес-логика
- [ ] `app/modules/{module}/repository.py` — доступ к данным
- [ ] `app/modules/{module}/schemas.py` — Pydantic DTO
- [ ] `tests/` — директория тестов
- [ ] `Dockerfile` — стандартный multi-stage
- [ ] `pyproject.toml` — зависимости и инструменты
- [ ] `alembic.ini` + `alembic/` — миграции

## Three-Tier Separation

- [ ] **Router** — только HTTP-валидация и вызов service
- [ ] **Router** — не содержит SQL-запросов
- [ ] **Router** — не содержит бизнес-логики
- [ ] **Router** — использует `Depends(get_service)` для DI
- [ ] **Router** — использует `Depends(require_internal_token)` для internal endpoints
- [ ] **Service** — содержит всю бизнес-логику
- [ ] **Service** — не импортирует `fastapi`, `Request`, `Response`
- [ ] **Service** — принимает Repository через Protocol (interface) в `__init__`
- [ ] **Service** — кидает доменные исключения (не HTTPException)
- [ ] **Repository** — только SQL-запросы и маппинг
- [ ] **Repository** — не содержит бизнес-логики
- [ ] **Repository** — не вызывает внешние API
- [ ] **Repository** — возвращает ORM-объекты или dict

## Config

- [ ] `pydantic-settings` вместо `os.environ`
- [ ] Уникальный `env_prefix` для сервиса (например, `IDENTITY_`)
- [ ] `.env` файл с примером (`.env.example`)
- [ ] `model_config = SettingsConfigDict(env_file=".env", extra="ignore")`

## Database

- [ ] `pool_pre_ping=True` в engine
- [ ] `expire_on_commit=False` в sessionmaker
- [ ] `get_session()` — `async with session.begin()` + commit/rollback
- [ ] Все модели наследуются от `Base`
- [ ] UUID primary keys через `PG_UUID(as_uuid=True)`
- [ ] `utc_now()` хелпер для `default` и `onupdate`
- [ ] `created_at` / `updated_at` на всех таблицах
- [ ] Индексы на часто запрашиваемые поля

## Security

- [ ] Internal endpoints защищены `require_internal_token`
- [ ] Public endpoints (только gateway) защищены JWT
- [ ] X-User-ID пробрасывается от gateway
- [ ] X-Request-ID / X-Correlation-ID поддерживаются

## Event-Driven (if applicable)

- [ ] Outbox table `outbox_events` с корректными индексами
- [ ] Outbox publisher как asyncio task в lifespan
- [ ] Deduplication через `processed_events` таблицу
- [ ] Kafka consumer как asyncio task в lifespan
- [ ] Graceful shutdown (cancel tasks, stop consumer)

## API Contract

- [ ] Префикс `/internal/{name}/...` для internal endpoints
- [ ] `/health` — всегда UP
- [ ] `/ready` — проверка соединения с БД
- [ ] Единый формат ошибок через `ErrorEnvelope`

## Tests

- [ ] `_service_path.py` для корректировки PYTHONPATH
- [ ] `conftest.py` с фикстурами test client и session
- [ ] Тесты на все эндпоинты (200, 4xx, 5xx)
- [ ] Тесты на бизнес-логику (unit, с моками репозитория)
- [ ] Тесты на репозиторий (integration, с тестовой БД)

## Anti-patterns to avoid

- [ ] ❌ Бизнес-логика в `router.py`
- [ ] ❌ Бизнес-логика в `repository.py`
- [ ] ❌ Прямые SQL-запросы в роутере
- [ ] ❌ `os.environ.get()` в бизнес-логике
- [ ] ❌ Sync функции в async хендлерах
- [ ] ❌ Глобальные переменные состояния
- [ ] ❌ Хардкод URL/токенов
- [ ] ❌ Вызов внешнего API в репозитории
- [ ] ❌ HTTPException из сервисного слоя
- [ ] ❌ Импорт `fastapi` в сервисах/репозиториях
