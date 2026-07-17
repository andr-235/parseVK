# Project Base Rules

> Auto-detected conventions from codebase analysis. Edit as needed.

## Naming Conventions

- **Python files:** snake_case (e.g., `export_service.py`, `schemas.py`)
- **Python variables/functions:** snake_case
- **Python classes:** PascalCase
- **Python constants:** UPPER_SNAKE_CASE
- **TypeScript files (utils):** camelCase (e.g., `authors.ts`, `useDebounce.ts`)
- **TypeScript components:** PascalCase.tsx (e.g., `AuthorsPage.tsx`)
- **TypeScript variables/functions:** camelCase
- **TypeScript hooks:** camelCase with `use` prefix
- **API serialization:** camelCase via `CamelModel` base class (Pydantic with alias_generator)

## Module Structure

- **Python services:** `services/<name>/app/{core,modules,db}/`
- **Frontend:** `front/src/` with feature-based organization
- **Shared Python library:** `libs/py/common/`

## Error Handling

- **Python routers:** Raise `HTTPException` with appropriate status codes
- **Python services:** try/except with error persistence to DB + logging
- **TypeScript:** Custom `ApiError extends Error` class, handled via TanStack Query `isError` state
- **Health checks:** Catch-all exception handler returning 503

## Logging

- Standard library `logging` module (not loguru/structlog)
- Module-level loggers: `logger = logging.getLogger(__name__)`
- Levels: `info` (lifecycle), `warning` (edge cases), `error` (failures), `exception` (with traceback), `debug` (details)

## Testing

- **Python:** pytest with `@pytest.mark.anyio` for async, httpx `AsyncClient` for API tests, `unittest.mock` for mocking
- **TypeScript:** vitest with `@testing-library/react`, `userEvent`, `jest-dom` matchers
- **Test files:** Python `test_<name>.py`, TypeScript `__tests__/<Name>.test.tsx`
