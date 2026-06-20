# ParseVK Content Service

Хранилище и read-модель контента ParseVK: группы, авторы, посты,
комментарии, IM-сообщения и группы мониторинга.

## Архитектура

Сервис использует dependency flow:

```text
api / tasks -> services -> domain <- infrastructure
```

- `app/api/` — FastAPI routers, schemas и dependency factories.
- `app/services/` — application use cases без FastAPI, SQLAlchemy и Kafka.
- `app/domain/` — repository/client Protocols, typed events и ошибки.
- `app/infrastructure/db/` — SQLAlchemy models, repositories и session factory.
- `app/infrastructure/clients/` — VK и moderation HTTP adapters.
- `app/infrastructure/messaging/` — Kafka transport, retry и poison policy.
- `app/tasks/` — lifecycle фоновых projection workers.
- `app/bootstrap.py` — composition root.

Routers не создают repositories или clients. Application services зависят
только от узких Protocols. Транзакция Kafka-события завершается до commit
offset.

## Контракты

- Content API: `/internal/content/*`, требуется internal service token.
- Monitoring API: `/monitoring/*`; текущая политика доступа сохранена.
- Kafka topics: `parsevk.vk.events`, `parsevk.im.events`.
- IM identity: `(messenger, chat_external_id, external_id)`.
- Unknown event types use strict `retry` policy: validation fails, offset is not
  committed, and the configured poison policy applies after bounded retries.

## Запуск проверок

```powershell
cd services/content-service
uv run pytest tests/ -v
uv run ruff check app tests alembic
uv run alembic heads
uv run alembic history
```

Для migration smoke требуется PostgreSQL:

```powershell
$env:CONTENT_TEST_DATABASE_URL="postgresql+asyncpg://content:content@localhost:5435/content_test"
uv run pytest tests/integration/ -v
```

Integration suite работает только с отдельной disposable database, имя которой
содержит `test`, и выполняет reset, migration cycle, metadata comparison,
idempotency и rollback checks.

## Kafka failure policy

Transient failures повторяются согласно `CONTENT_KAFKA_RETRY_*`. После
исчерпания попыток policy `pause` останавливает чтение назначенных partitions,
не коммитит offset и переводит readiness в ошибку. Policy `stop` завершает
consumer исключением.

## Безопасность логов

Логи содержат event ID/type, topic, partition, offset и correlation ID.
Токены, database URLs с credentials и полные пользовательские payloads
логировать нельзя.

HTTP boundary logs include operation, request/correlation ID, response status,
and duration. Correlation and request IDs are returned in response headers.
