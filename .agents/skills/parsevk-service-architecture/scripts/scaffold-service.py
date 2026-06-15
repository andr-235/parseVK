#!/usr/bin/env python3
"""
parseVK Service Scaffolder.

Usage:
    python scaffold-service.py {service-name} [--with-db] [--with-kafka] [--with-outbox]

Creates a new FastAPI microservice in services/{service-name}/ following
the parseVK architecture standard.
"""

import os
import sys
import shutil
from pathlib import Path

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "assets" / "service-template"


def snake(name: str) -> str:
    return name.replace("-", "_")


def kebab(name: str) -> str:
    return name


def pascal(name: str) -> str:
    return "".join(word.capitalize() for word in name.replace("-", " ").replace("_", " ").split())


def env_prefix(name: str) -> str:
    return name.upper().replace("-", "_")


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  Created {path.relative_to(path.parent.parent.parent)}")


def scaffold(service_name: str, with_db: bool = True, with_kafka: bool = False, with_outbox: bool = False) -> None:
    root = Path("services") / service_name
    if root.exists():
        print(f"Error: {root} already exists")
        sys.exit(1)

    s = snake(service_name)
    p = pascal(service_name)
    prefix = env_prefix(service_name)

    print(f"\nScaffolding service: {service_name}")
    print(f"  Snake: {s}")
    print(f"  Pascal: {p}")
    print(f"  Prefix: {prefix}")
    print()

    # app/__init__.py
    write(root / "app" / "__init__.py", "")

    # app/main.py
    lifespan_code = ""
    if with_kafka:
        lifespan_code = '''
import asyncio
from contextlib import asynccontextmanager, suppress

from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage background tasks (Kafka consumer, outbox publisher)."""
    tasks = []
    if settings.kafka_consumer_enabled:
        from app.modules.{s}.consumer import {p}Consumer
        consumer = {p}Consumer()
        tasks.append(asyncio.create_task(consumer.run_forever()))
    try:
        yield
    finally:
        for t in tasks:
            t.cancel()
            with suppress(asyncio.CancelledError):
                await t
'''
    else:
        lifespan_code = '''
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
'''

    main_py = f'''from fastapi import FastAPI
{lifespan_code}

from app.modules.{s}.router import router as {s}_router


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK {p} Service", lifespan=lifespan)

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {{"status": "UP"}}

    @app.get("/ready")
    async def ready() -> dict[str, str]:
        from app.db.session import engine
        from sqlalchemy import text
        from fastapi import HTTPException
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            return {{"status": "READY"}}
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Database is not ready: {{str(e)}}")

    app.include_router({s}_router)

    return app


app = create_app()
'''
    write(root / "app" / "main.py", main_py)

    # app/core/__init__.py
    write(root / "app" / "core" / "__init__.py", "")

    # app/core/config.py
    db_url = f"postgresql+asyncpg://{s}:{s}@localhost:5432/{s}"

    config_code = f'''from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="{prefix}_", extra="ignore")

    app_name: str = "parseVK {p} Service"
    database_url: str = Field(default="{db_url}")
    internal_service_token: str = Field(default="dev-internal-token")
'''

    if with_kafka:
        config_code += f'''
    kafka_bootstrap_servers: str = "kafka:9092"
    kafka_consumer_enabled: bool = True
    kafka_topic: str = "parsevk.{s}.events"
'''

    config_code += '''
settings = Settings()
'''
    write(root / "app" / "core" / "config.py", config_code)

    # app/core/security.py
    security_py = '''from fastapi import Header, HTTPException, status

from app.core.config import settings


async def require_internal_token(
    x_internal_service_token: str | None = Header(default=None, alias="X-Internal-Service-Token"),
) -> None:
    if not x_internal_service_token or x_internal_service_token != settings.internal_service_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
'''
    write(root / "app" / "core" / "security.py", security_py)

    if with_db or with_outbox:
        # app/db/__init__.py
        write(root / "app" / "db" / "__init__.py", "")

        # app/db/base.py
        write(root / "app" / "db" / "base.py", '''from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
''')

        # app/db/session.py
        session_py = '''from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        async with session.begin():
            yield session
'''
        write(root / "app" / "db" / "session.py", session_py)

        # app/db/models.py
        models_code = '''from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)
'''

        if with_outbox:
            models_code += '''

OUTBOX_PENDING = "pending"
OUTBOX_PUBLISHED = "published"
OUTBOX_FAILED = "failed"
'''

        models_code += f'''

class {p}Item(Base):
    __tablename__ = "{s}_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )
'''

        if with_outbox:
            models_code += '''

class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    event_type: Mapped[str] = mapped_column(String(255), nullable=False)
    event_version: Mapped[int] = mapped_column(nullable=False, default=1)
    aggregate_type: Mapped[str] = mapped_column(String(255), nullable=False)
    aggregate_id: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=OUTBOX_PENDING)
    attempts: Mapped[int] = mapped_column(nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
'''

        write(root / "app" / "db" / "models.py", models_code)

    # app/modules/__init__.py
    write(root / "app" / "modules" / "__init__.py", "")

    # app/modules/{name}/__init__.py
    write(root / "app" / "modules" / s / "__init__.py", "")

    # app/modules/{name}/schemas.py
    schemas_py = f'''from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class {p}ItemResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime


class {p}ItemCreate(BaseModel):
    name: str
'''
    write(root / "app" / "modules" / s / "schemas.py", schemas_py)

    # app/modules/{name}/repository.py
    if with_db:
        repo_code = f'''from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import {p}Item


class {p}Repository:
    def __init__(self, session: AsyncSession):
        self._session = session

    async def find_all(self) -> list[{p}Item]:
        result = await self._session.scalars(
            select({p}Item).order_by({p}Item.created_at.desc())
        )
        return list(result)

    async def find_by_id(self, item_id: UUID) -> {p}Item | None:
        return await self._session.get({p}Item, item_id)

    async def create(self, name: str) -> {p}Item:
        item = {p}Item(name=name)
        self._session.add(item)
        await self._session.flush()
        return item
'''
    else:
        repo_code = f'''class {p}Repository:
    """In-memory stub — replace with DB implementation."""

    def __init__(self):
        self._items: dict[str, dict] = {{}}

    async def find_all(self) -> list[dict]:
        return list(self._items.values())

    async def create(self, name: str) -> dict:
        item = {{"id": name, "name": name}}
        self._items[name] = item
        return item
'''
    write(root / "app" / "modules" / s / "repository.py", repo_code)

    # app/modules/{name}/service.py
    service_code = f'''from typing import Protocol

from app.modules.{s}.schemas import {p}ItemResponse


class {p}Repo(Protocol):
    async def find_all(self) -> list: ...
    async def create(self, name: str) -> object: ...


class {p}Service:
    def __init__(self, *, repo: {p}Repo):
        self._repo = repo

    async def list_items(self) -> list[{p}ItemResponse]:
        items = await self._repo.find_all()
        return [{p}ItemResponse.model_validate(item) for item in items]

    async def create_item(self, name: str) -> {p}ItemResponse:
        item = await self._repo.create(name)
        return {p}ItemResponse.model_validate(item)
'''
    write(root / "app" / "modules" / s / "service.py", service_code)

    # app/modules/{name}/router.py
    router_code = f'''from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_internal_token
'''

    if with_db:
        router_code += '''from app.db.session import get_session
'''

    router_code += f'''from app.modules.{s}.schemas import {p}ItemCreate, {p}ItemResponse
from app.modules.{s}.service import {p}Service
from app.modules.{s}.repository import {p}Repository

router = APIRouter(
    prefix="/internal/{s}",
    tags=["{s}"],
    dependencies=[Depends(require_internal_token)],
)
'''

    if with_db:
        router_code += f'''

async def get_service(session: AsyncSession = Depends(get_session)) -> {p}Service:
    return {p}Service(repo={p}Repository(session))
'''
    else:
        router_code += f'''

async def get_service() -> {p}Service:
    return {p}Service(repo={p}Repository())
'''

    router_code += f'''

@router.get("/items", response_model=list[{p}ItemResponse])
async def list_items(
    service: {p}Service = Depends(get_service),
) -> list[{p}ItemResponse]:
    return await service.list_items()


@router.post("/items", response_model={p}ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_item(
    payload: {p}ItemCreate,
    service: {p}Service = Depends(get_service),
) -> {p}ItemResponse:
    return await service.create_item(payload.name)
'''
    write(root / "app" / "modules" / s / "router.py", router_code)

    if with_kafka:
        # consumer.py
        consumer_code = f'''import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer

from app.core.config import settings

logger = logging.getLogger(__name__)


class {p}Consumer:
    def __init__(self):
        self.consumer = AIOKafkaConsumer(
            settings.kafka_topic,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=f"{s}-group",
        )

    async def run_forever(self) -> None:
        await self.consumer.start()
        try:
            async for msg in self.consumer:
                await self._handle(json.loads(msg.value))
        except asyncio.CancelledError:
            pass
        finally:
            await self.consumer.stop()

    async def _handle(self, event: dict) -> None:
        logger.info("Received event: %s", event.get("event_type"))
'''
        write(root / "app" / "modules" / s / "consumer.py", consumer_code)

    if with_outbox:
        # outbox publisher
        outbox_code = f'''import asyncio
import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import OutboxEvent
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


class {p}OutboxPublisher:
    def __init__(self):
        self._running = True

    async def run_forever(self) -> None:
        while self._running:
            try:
                async with SessionLocal() as session:
                    async with session.begin():
                        events = await self._fetch_pending(session)
                        for event in events:
                            await self._publish(event)
                            event.status = "published"
                            event.published_at = datetime.now(timezone.utc)
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("Outbox publish cycle failed")
            await asyncio.sleep(1)

    async def _fetch_pending(self, session: AsyncSession) -> list[OutboxEvent]:
        result = await session.scalars(
            select(OutboxEvent)
            .where(OutboxEvent.status == "pending")
            .order_by(OutboxEvent.created_at.asc())
            .limit(100)
        )
        return list(result)

    async def _publish(self, event: OutboxEvent) -> None:
        logger.debug("Publishing event %s: %s", event.event_type, event.id)

    def stop(self) -> None:
        self._running = False
'''
        write(root / "app" / "modules" / s / "outbox.py", outbox_code)

    # tests/
    test_code = f'''import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {{"status": "UP"}}
'''
    write(root / "tests" / "__init__.py", "")
    write(root / "tests" / f"test_{s}.py", test_code)

    # _service_path.py
    write(root / "tests" / "_service_path.py", f'''import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app"))
''')

    # Dockerfile
    dockerfile = f'''FROM python:3.12.13-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY libs/py/common ./libs/py/common
COPY services/{service_name} ./services/{service_name}

RUN pip install --no-cache-dir --upgrade pip \\
    && pip install --no-cache-dir ./libs/py/common ./services/{service_name}

WORKDIR /app/services/{service_name}

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
'''
    write(root / "Dockerfile", dockerfile)

    # pyproject.toml
    deps = [
        "fastapi>=0.115",
        "uvicorn[standard]>=0.30",
        "pydantic-settings>=2.4",
    ]
    if with_db:
        deps.extend([
            "sqlalchemy[asyncio]>=2.0",
            "asyncpg>=0.29",
            "alembic>=1.13",
        ])
    if with_kafka:
        deps.append("aiokafka>=0.14")

    deps_str = "\n".join(f'  "{d}",' for d in deps)

    pyproject = f'''[project]
name = "parsevk-{service_name}"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
{deps_str}
]

[project.optional-dependencies]
test = ["httpx>=0.27", "pytest>=8.3", "pytest-asyncio>=0.23"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["app"]
'''
    write(root / "pyproject.toml", pyproject)

    if with_db:
        # alembic.ini
        alembic_ini = f'''[alembic]
script_location = alembic
prepend_sys_path = .
sqlalchemy.url = {db_url}

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

[logger_alembic]
level = INFO

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%%(name)s] %%(message)s
'''
        write(root / "alembic.ini", alembic_ini)
        write(root / "alembic" / ".gitkeep", "")
        write(root / "alembic" / "versions" / ".gitkeep", "")

        # alembic/env.py
        env_py = f'''import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings
from app.db.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = settings.database_url
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(settings.database_url, poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
'''
        write(root / "alembic" / "env.py", env_py)

        # alembic/script.py.mako
        write(root / "alembic" / "script.py.mako", '''"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
''')

    # .env.example
    env_example = f'''{prefix}_DATABASE_URL={db_url}
{prefix}_INTERNAL_SERVICE_TOKEN=dev-internal-token
'''
    if with_kafka:
        env_example += f'''{prefix}_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
'''
    write(root / ".env.example", env_example)

    print(f"\n✓ Service '{service_name}' scaffolded at services/{service_name}")
    print()
    print("Next steps:")
    print(f"  1. cd services/{service_name}")
    print("  2. uv sync")
    print("  3. Update app/db/models.py with your domain models")
    print("  4. Update app/modules/{s}/ with your business logic")
    print("  5. Create initial alembic migration")
    print("  6. Run tests: pytest")
    print()


def main():
    if len(sys.argv) < 2:
        print("Usage: python scaffold-service.py <service-name> [--with-db] [--with-kafka] [--with-outbox]")
        print()
        print("Options:")
        print("  --with-db      Include SQLAlchemy + asyncpg + alembic")
        print("  --with-kafka   Include Kafka consumer")
        print("  --with-outbox  Include outbox pattern (implies --with-db)")
        sys.exit(1)

    service_name = sys.argv[1]
    flags = set(sys.argv[2:])

    with_db = "--with-db" in flags
    with_kafka = "--with-kafka" in flags
    with_outbox = "--with-outbox" in flags or "--with-db-outbox" in flags

    if with_outbox and not with_db:
        print("--with-outbox implies --with-db, enabling both")
        with_db = True

    # Validate name
    if not re.match(r'^[a-z0-9]+(-[a-z0-9]+)*$', service_name):
        print(f"Error: service name '{service_name}' must be lowercase kebab-case")
        sys.exit(1)

    scaffold(service_name, with_db=with_db, with_kafka=with_kafka, with_outbox=with_outbox)


if __name__ == "__main__":
    import re
    main()
