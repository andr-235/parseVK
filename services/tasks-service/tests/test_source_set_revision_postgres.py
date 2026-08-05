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
async def test_source_set_revision_serializes_effective_set_changes():
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

        source_ids = [uuid4(), uuid4(), uuid4()]
        run_id = uuid4()
        async with sessions() as session, session.begin():
            task = Task(
                owner_user_id="user-1",
                title="source revision",
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
                        id=source_id,
                        owner_user_id="user-1",
                        provider="vk",
                        source_type="community",
                        external_id=str(index + 1),
                        owner_id=-(index + 1),
                    )
                    for index, source_id in enumerate(source_ids)
                ]
            )
            await session.flush()
            task_id = task.id

        async def attach(source_id):
            async with sessions() as session, session.begin():
                await SourcesRepository(session).link_task_source(
                    task_id,
                    source_id,
                )

        await asyncio.gather(attach(source_ids[0]), attach(source_ids[1]))

        async with sessions() as session, session.begin():
            repo = SourcesRepository(session)
            task = await session.get(Task, task_id)
            assert task is not None
            assert task.source_set_revision == 2
            assert task.revision == 0

            await repo.link_task_source(task_id, source_ids[0], "target")
            assert task.source_set_revision == 2

            await repo.link_task_source(task_id, source_ids[0], "reference")
            assert task.source_set_revision == 3

            changed = await repo.sync_task_sources(
                task_id,
                (
                    (source_ids[0], "reference"),
                    (source_ids[2], "target"),
                ),
            )
            assert changed is True
            assert task.source_set_revision == 4

            assert await repo.unlink_task_source(task_id, source_ids[1]) is False
            assert task.source_set_revision == 4
            assert await repo.unlink_task_source(task_id, source_ids[2]) is True
            assert task.source_set_revision == 5

        async with sessions() as session, session.begin():
            task = await session.get(Task, task_id)
            assert task is not None
            metadata = await freeze_task_run(session, task)
            run = await session.get(TaskRun, UUID(task.execution_run_id))
            links = list(
                (
                    await session.scalars(
                        select(TaskSource).where(TaskSource.task_id == task_id)
                    )
                ).all()
            )
            assert len(links) == 1
            assert metadata["sourceSetRevision"] == 5
            assert run is not None and run.source_set_revision == 5
    finally:
        if engine is not None:
            await engine.dispose()
        container.stop()
