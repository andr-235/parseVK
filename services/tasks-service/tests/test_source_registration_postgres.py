import asyncio
import os

import asyncpg
import pytest
from _service_path import use_service_path
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

use_service_path()

from app.db.base import Base
from app.db.models import MonitoringSource, SourceRegistration
from app.modules.sources.resolver import (
    InternalVkSourceResolver,
    canonical_source_id,
)
from app.modules.sources.schemas import CreateSourceRequest
from app.modules.sources.service import SourcesService

pytestmark = pytest.mark.integration


async def _wait_for_postgres(host: str, port: int) -> None:
    last_error = None
    for _ in range(100):
        try:
            connection = await asyncpg.connect(
                host=host,
                port=port,
                user="postgres",
                password="postgres",
                database="postgres",
            )
            await connection.close()
            return
        except (OSError, asyncpg.PostgresError) as exc:
            last_error = exc
            await asyncio.sleep(0.1)
    raise RuntimeError("PostgreSQL test container did not become ready") from last_error


async def _register(
    sessions,
    owner_user_id: str,
    external_id: str,
):
    request = CreateSourceRequest(
        externalId=external_id,
        displayName=f"registered by {owner_user_id}",
    )
    async with sessions() as session, session.begin():
        service = SourcesService(session, InternalVkSourceResolver())
        source = await service.create_source(owner_user_id, request)
        repeated = await service.create_source(owner_user_id, request)
        visible, total = await service.list_sources(owner_user_id)
        assert repeated.id == source.id
        assert total == 1
        assert [item.id for item in visible] == [source.id]
        return source.id


@pytest.mark.asyncio
async def test_concurrent_registration_returns_one_global_source_per_identity():
    container = (
        DockerContainer("postgres:16-alpine")
        .with_env("POSTGRES_USER", "postgres")
        .with_env("POSTGRES_PASSWORD", "postgres")
        .with_env("POSTGRES_DB", "postgres")
        .with_exposed_ports(5432)
    )
    container.start()
    engine = None
    try:
        host = container.get_container_host_ip()
        port = int(container.get_exposed_port(5432))
        await _wait_for_postgres(host, port)
        engine = create_async_engine(
            f"postgresql+asyncpg://postgres:postgres@{host}:{port}/postgres",
            pool_pre_ping=True,
        )
        sessions = async_sessionmaker(engine, expire_on_commit=False)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        repeats = int(os.getenv("P0_P2_CONCURRENCY_REPEATS", "1"))
        for iteration in range(repeats):
            external_id = str(900000 + iteration)
            expected_source_id = canonical_source_id(
                "vk",
                "community",
                external_id,
            )
            owners = [f"user-{iteration}-{index}" for index in range(6)]
            source_ids = await asyncio.gather(
                *(
                    _register(sessions, owner, external_id)
                    for owner in owners
                )
            )
            assert source_ids == [expected_source_id] * len(owners)

            async with sessions() as session:
                source = await session.get(MonitoringSource, expected_source_id)
                assert source is not None
                initial_metadata_owner = source.owner_user_id
                source_count = await session.scalar(
                    select(func.count())
                    .select_from(MonitoringSource)
                    .where(MonitoringSource.external_id == external_id)
                )
                registration_count = await session.scalar(
                    select(func.count())
                    .select_from(SourceRegistration)
                    .where(SourceRegistration.source_id == expected_source_id)
                )
                assert source_count == 1
                assert registration_count == len(owners)

            late_owner = f"user-{iteration}-late"
            assert await _register(
                sessions,
                late_owner,
                external_id,
            ) == expected_source_id
            async with sessions() as session:
                source = await session.get(MonitoringSource, expected_source_id)
                assert source is not None
                assert source.owner_user_id == initial_metadata_owner
    finally:
        if engine is not None:
            await engine.dispose()
        container.stop()
