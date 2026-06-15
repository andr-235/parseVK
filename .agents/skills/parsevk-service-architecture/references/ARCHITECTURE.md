# parseVK FastAPI Service Architecture Standard

## Three-Tier Architecture

Каждый микросервис строго следует трёхуровневой архитектуре:

```
Router → Service → Repository
```

### Layer responsibilities

| Layer | Responsibility | Location | Imports |
|-------|---------------|----------|---------|
| **Router** | Валидация HTTP-запроса, вызов сервиса, маппинг ответа | `modules/{name}/router.py` | `fastapi.APIRouter`, `Depends`, `HTTPException` из сервиса |
| **Service** | Бизнес-логика, оркестрация, вызов репозиториев | `modules/{name}/service.py` | Repository protocols, domain exceptions |
| **Repository** | Доступ к данным (SQL), маппинг ORM → dict/DTO | `modules/{name}/repository.py` | SQLAlchemy `select`, models |

### What NOT to do in each layer

- ❌ **Router** — не содержит бизнес-логику, SQL-запросы, или прямые вызовы БД
- ❌ **Service** — не знает о HTTP, `Request`/`Response`, статус-кодах
- ❌ **Repository** — не содержит бизнес-логику, валидацию, или вызов внешних API

---

## Project Structure

```
services/{service-name}/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── cli.py                        # CLI entry points (optional)
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                 # pydantic-settings BaseSettings
│   │   └── security.py               # require_internal_token, auth helpers
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py                   # SQLAlchemy DeclarativeBase
│   │   ├── session.py                # engine, AsyncSessionLocal, get_session
│   │   └── models.py                 # ORM models
│   └── modules/
│       ├── __init__.py
│       └── {module-name}/
│           ├── __init__.py
│           ├── router.py             # APIRouter with endpoints
│           ├── service.py            # Business logic (if any)
│           ├── schemas.py            # Pydantic request/response DTOs
│           └── repository.py         # Data access layer (if DB)
├── alembic/
│   └── versions/
├── tests/
│   ├── __init__.py
│   ├── _service_path.py              # PYTHONPATH fix
│   ├── conftest.py                   # Fixtures (session, client)
│   └── test_{module}.py
├── alembic.ini
├── Dockerfile
├── pyproject.toml
└── uv.lock
```

---

## Key Patterns

### 1. `create_app()` factory

**File: `app/main.py`**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.modules.{name}.router import router as {name}_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create Kafka consumer, outbox publisher, etc.
    yield
    # Shutdown: cancel tasks, close connections

def create_app() -> FastAPI:
    app = FastAPI(title="parseVK {Service Name}", lifespan=lifespan)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    @app.get("/ready")
    async def ready() -> dict[str, str]:
        from app.db.session import engine
        from sqlalchemy import text
        from fastapi import HTTPException
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {"status": "READY"}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}")

    app.include_router({name}_router)
    return app

app = create_app()
```

### 2. Configuration via pydantic-settings

**File: `app/core/config.py`**

```python
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="{PREFIX}_",  # e.g., "IDENTITY_", "CONTENT_"
        extra="ignore",
    )

    app_name: str = "parseVK {Service Name}"
    database_url: str = Field(default="postgresql+asyncpg://...")
    internal_service_token: str = Field(default="dev-internal-token")

settings = Settings()
```

### 3. Internal service auth

**File: `app/core/security.py`**

```python
from fastapi import Header, HTTPException, status
from app.core.config import settings

async def require_internal_token(
    x_internal_service_token: str | None = Header(default=None, alias="X-Internal-Service-Token"),
) -> None:
    if not x_internal_service_token or x_internal_service_token != settings.internal_service_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
```

### 4. Database session

**File: `app/db/base.py`**

```python
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass
```

**File: `app/db/session.py`**

```python
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        async with session.begin():
            yield session
```

### 5. Router layer

**File: `app/modules/{name}/router.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import require_internal_token
from app.db.session import get_session
from app.modules.{name}.schemas import RequestSchema, ResponseSchema
from app.modules.{name}.service import {Name}Service, {Name}Error
from app.modules.{name}.repository import {Name}Repository

router = APIRouter(
    prefix="/internal/{name}",
    tags=["{name}"],
    dependencies=[Depends(require_internal_token)],
)

def get_service(session: AsyncSession = Depends(get_session)) -> {Name}Service:
    return {Name}Service(repo={Name}Repository(session))

@router.get("/items")
async def list_items(
    service: {Name}Service = Depends(get_service),
) -> list[ResponseSchema]:
    try:
        return await service.list_items()
    except {Name}Error as exc:
        raise HTTPException(status_code=400, detail=str(exc))
```

### 6. Service layer with Protocol dependencies

**File: `app/modules/{name}/service.py`**

```python
from typing import Protocol
from app.modules.{name}.schemas import ResponseSchema

class {Name}Repo(Protocol):
    async def find_all(self) -> list[ResponseSchema]: ...

class {Name}Error(Exception): ...

class {Name}Service:
    def __init__(self, *, repo: {Name}Repo):
        self._repo = repo

    async def list_items(self) -> list[ResponseSchema]:
        items = await self._repo.find_all()
        # Business logic here, if any
        return items
```

### 7. Repository layer

**File: `app/modules/{name}/repository.py`**

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import {Model}

class {Name}Repository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def find_all(self) -> list[{Model}]:
        result = await self._session.scalars(
            select({Model}).order_by({Model}.created_at.desc())
        )
        return list(result)

    async def find_by_id(self, id: int) -> {Model} | None:
        return await self._session.get({Model}, id)
```

### 8. Domain exceptions in service

```python
class {Name}Error(Exception):
    def __init__(self, message: str = "{Name} error"):
        self.message = message
        super().__init__(message)

class {Name}NotFound({Name}Error):
    def __init__(self, item_id: int):
        self.message = f"{Name} {item_id} not found"
        super().__init__(self.message)
```

---

## Event-Driven Architecture

### Outbox Pattern

Каждый сервис, который публикует события, использует outbox:

```python
# app/db/models.py
class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    event_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    aggregate_type: Mapped[str] = mapped_column(String(255), nullable=False)
    aggregate_id: Mapped[str] = mapped_column(Text, nullable=False)
    correlation_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_attempt_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
```

### Kafka Consumer

```python
# app/modules/{name}/consumer.py
import asyncio, logging
from aiokafka import AIOKafkaConsumer
from app.core.config import settings

logger = logging.getLogger(__name__)

class {Name}Consumer:
    def __init__(self):
        self.consumer = AIOKafkaConsumer(
            settings.kafka_topic,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=settings.kafka_group_id,
        )

    async def run_forever(self) -> None:
        await self.consumer.start()
        try:
            async for msg in self.consumer:
                await self.handle_message(msg)
        except asyncio.CancelledError:
            pass
        finally:
            await self.consumer.stop()

    async def handle_message(self, msg) -> None:
        ...
```

### Event envelope format

```python
# libs/py/common/common/events.py
class EventEnvelope(BaseModel):
    event_id: UUID
    event_type: str
    event_version: int = 1
    occurred_at: datetime
    producer: str
    correlation_id: str | None = None
    payload: dict[str, Any]
```

---

## API Contract Standards

### Routing

| Prefix | Access | Service |
|--------|--------|---------|
| `/api/v1/...` | Public (with JWT) | api-gateway only |
| `/internal/{service}/...` | Internal (service token) | All internal services |

### Headers

- `X-Internal-Service-Token` — для internal-запросов между сервисами
- `X-User-ID` — ID пользователя (пробрасывается от gateway)
- `X-Request-ID` — идентификатор запроса
- `X-Correlation-ID` — сквозной идентификатор для трейсинга

### Error format

```json
{
    "error": {
        "code": "RESOURCE_NOT_FOUND",
        "message": "User not found",
        "field": null
    },
    "request_id": "req_abc123"
}
```

**File: `libs/py/common/common/errors.py`**

```python
class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None

class ErrorEnvelope(BaseModel):
    error: ErrorDetail
    request_id: str | None = None
```

---

## Dockerfile Standard

```dockerfile
FROM python:3.12.13-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY libs/py/common ./libs/py/common
COPY services/{service-name} ./services/{service-name}

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir ./libs/py/common ./services/{service-name}

WORKDIR /app/services/{service-name}

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## pyproject.toml Standard

```toml
[project]
name = "parsevk-{service-name}"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "fastapi>=0.115",
  "uvicorn[standard]>=0.30",
  "pydantic-settings>=2.4",
  "sqlalchemy[asyncio]>=2.0",
  "asyncpg>=0.29",
  "alembic>=1.13",
]

[project.optional-dependencies]
test = ["httpx>=0.27", "pytest>=8.3", "pytest-asyncio>=0.23"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["app"]
```

---

## Migration Files

```
services/{service-name}/alembic.ini
services/{service-name}/alembic/
├── env.py
├── script.py.mako
└── versions/
    └── 0001_initial.py
```

**alembic.ini**

```ini
[alembic]
script_location = alembic
prepend_sys_path = .

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
```
