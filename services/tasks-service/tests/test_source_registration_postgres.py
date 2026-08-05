import asyncio
import os
from uuid import uuid4

import asyncpg
import pytest
from _service_path import use_service_path
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

use_service_path()

from app.db.base import Base
from app.db.models import MonitoringSource, SourceRegistration
from app.modules.sources.repository import SourcesRepository
from app.modules.sources.resolver import canonical_source_id

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

            async def register(owner_user_id: str):
                async with sessions() as session, session.begin():
                    repository = SourcesRepository(session)
                    source = await repository.get_or_create_source(
                        MonitoringSource(
                            id=expected_source_id,
                            owner_user_id=owner_user_id,
                            provider="vk",
                            source_type="community",
                            external_id=external_id,
                            owner_id=-int(external_id),
                            display_name=f"registered by {owner_user_id}",
                        )
                    )
                    await repository.ensure_source_registration(
                        owner_user_id,
                        source.id,
                    )
                    await repository.ensure_source_registration(
                        owner_user_id,
                        source.id,
                    )
                    return source.id

            source_ids = await asyncio.gather(
                *(register(owner) for owner in owners)
            )
            assert source_ids == [expected_source_id] * len(owners)

            async with sessions() as session:
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

                repository = SourcesRepository(session)
                for owner in owners:
                    visible, total = await repository.list_sources(owner)
                    assert total == 1
                    assert [source.id for source in visible] == [
                        expected_source_id
                    ]
    finally:
        if engine is not None:
            await engine.dispose()
        container.stop()
