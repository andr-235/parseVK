[← Configuration](configuration.md) · [Back to README](../README.md) · [Deploy Runbook →](deploy-runbook.md)

# Testing

## Python (pytest)

Запуск всех Python-тестов из корня проекта:

```powershell
pytest
```

Только конкретный сервис:

```powershell
cd services/<name>
uv run pytest tests/ -v
```

Конфиг тестов — корневой `pyproject.toml` (testpaths для 6 сервисов + libs, asyncio_mode=auto).

### Content service architecture and migrations

```powershell
cd services/content-service
uv run pytest tests/ -v
uv run ruff check app tests alembic
uv run alembic heads
uv run alembic history
```

Tests include HTTP/event contracts, application services, dependency-direction
checks, the 150-line production-file gate, repository mappings, and Kafka
retry/offset behavior. A PostgreSQL-backed migration check must run
`upgrade head -> downgrade 30edcb443fca -> upgrade head`.

## Frontend (Vitest)

```powershell
cd front
bun run test           # Vitest (однократно)
bun run test:watch     # Watch mode
```

## Go CLI

```powershell
cd tools/parsevkctl-go
go test ./...
```

## Структура тестов

| Слой | Фреймворк | Паттерн |
|------|-----------|---------|
| Python API | httpx + ASGITransport | `AsyncClient` с `app=create_app()` |
| Python async | pytest + anyio | `@pytest.mark.anyio` |
| Python моки | unittest.mock | `AsyncMock`, `patch` |
| TypeScript | vitest + testing-library | `render`, `userEvent`, `vi.fn()` |

## See Also

- [Configuration](configuration.md) — test database setup
- [Deploy Runbook](deploy-runbook.md) — CI/CD pipeline
