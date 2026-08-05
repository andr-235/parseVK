import asyncio
from uuid import UUID, uuid4

import asyncpg
import pytest
from _service_path import use_service_path
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

use_service_path()

from app.db.base import Base
from app.db.models import MonitoringSource, Task, TaskRun, TaskSource
from app.modules.sources.repository import SourcesRepository
from app.modules.tasks.task_run import freeze_task_run


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
async def test_freeze_and_attach_cannot_mix_revision_and_membership():
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

        first_source_id = uuid4()
        second_source_id = uuid4()
        run_id = uuid4()
        async with sessions() as session, session.begin():
            task = Task(
                owner_user_id="user-1",
                title="freeze race",
                status="pending",
                scope="selected",
                mode="recent_posts",
                group_ids=[],
                source="manual",
                execution_run_id=str(run_id),
            )
            session.add(task)
            session.add_all(
                [
                    MonitoringSource(
                        id=first_source_id,
                        owner_user_id="user-1",
                        provider="vk",
                        source_type="community",
                        external_id="101",
                        owner_id=-101,
                    ),
                    MonitoringSource(
                        id=second_source_id,
                        owner_user_id="user-1",
                        provider="vk",
                        source_type="community",
                        external_id="202",
                        owner_id=-202,
                    ),
                ]
            )
            await session.flush()
            task_id = task.id
            await SourcesRepository(session).link_task_source(
                task_id,
                first_source_id,
            )

        freeze_reading = asyncio.Event()
        release_freeze = asyncio.Event()

        class BlockingSourcesRepository(SourcesRepository):
            async def list_task_sources(self, current_task_id):
                freeze_reading.set()
                await release_freeze.wait()
                return await super().list_task_sources(current_task_id)

        async def freeze():
            async with sessions() as session, session.begin():
                task = await session.get(Task, task_id)
                assert task is not None
                return await freeze_task_run(
                    session,
                    task,
                    sources_repo=BlockingSourcesRepository(session),
                )

        async def attach():
            async with sessions() as session, session.begin():
                await SourcesRepository(session).link_task_source(
                    task_id,
                    second_source_id,
                )

        freeze_job = asyncio.create_task(freeze())
        await freeze_reading.wait()
        attach_job = asyncio.create_task(attach())
        await asyncio.sleep(0.1)
        assert not attach_job.done()

        release_freeze.set()
        frozen_meta = await freeze_job
        await attach_job

        async with sessions() as session:
            task = await session.get(Task, task_id)
            run = await session.get(TaskRun, UUID(str(run_id)))
            links = list(
                (
                    await session.scalars(
                        select(TaskSource).where(TaskSource.task_id == task_id)
                    )
                ).all()
            )
            assert task is not None and task.source_set_revision == 2
            assert run is not None and run.source_set_revision == 1
            assert frozen_meta["sourceSetRevision"] == 1
            assert len(run.source_set_snapshot) == 1
            assert run.source_set_snapshot[0]["sourceId"] == str(first_source_id)
            assert len(links) == 2
    finally:
        if engine is not None:
            await engine.dispose()
        container.stop()
