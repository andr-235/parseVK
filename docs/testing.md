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
