import asyncio
import os
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import asyncpg
from alembic import command
from alembic.config import Config
from testcontainers.core.container import DockerContainer

from app.core.config import settings


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


async def _seed_pre_migration_data(host: str, port: int) -> None:
    connection = await asyncpg.connect(
        host=host,
        port=port,
        user="postgres",
        password="postgres",
        database="postgres",
    )
    try:
        now = datetime(2026, 8, 5, tzinfo=UTC)
        await connection.executemany(
            """
            INSERT INTO tasks (
                id, owner_user_id, title, status, scope, mode, group_ids,
                post_limit, source, total_items, processed_items, progress,
                revision, last_execution_sequence, created_at, updated_at
            ) VALUES (
                $1, 'user-1', $2, 'pending', 'selected', 'recent_posts',
                ARRAY[]::bigint[], 10, 'manual', 0, 0, 0, $3, 0, $4, $4
            )
            """,
            [
                (1, "linked with run", 99, now),
                (2, "run without links", 2, now),
                (3, "linked without run", 0, now),
            ],
        )
        source_ids = [uuid4(), uuid4()]
        await connection.executemany(
            """
            INSERT INTO monitoring_sources (
                id, owner_user_id, provider, source_type, external_id,
                owner_id, status, revision, created_at, updated_at
            ) VALUES ($1, 'user-1', 'vk', 'community', $2, $3,
                      'active', 0, $4, $4)
            """,
            [
                (source_ids[0], "101", -101, now),
                (source_ids[1], "303", -303, now),
            ],
        )
        await connection.executemany(
            """
            INSERT INTO task_sources (
                id, task_id, source_id, kind, revision, created_at
            ) VALUES ($1, $2, $3, 'target', 0, $4)
            """,
            [
                (uuid4(), 1, source_ids[0], now),
                (uuid4(), 3, source_ids[1], now),
            ],
        )
        await connection.executemany(
            """
            INSERT INTO task_runs (
                id, task_id, run_revision, status, source_set_revision,
                snapshot_sha256, config_snapshot, source_set_snapshot,
                created_at
            ) VALUES (
                $1, $2, 1, 'requested', $3, repeat('a', 64),
                '{}'::jsonb,
                jsonb_build_array(
                    jsonb_build_object(
                        'sourceId', $4::text,
                        'provider', 'vk',
                        'sourceType', 'community',
                        'externalId', $5,
                        'ownerId', $6,
                        'sourceRevision', 0,
                        'taskRevision', $7
                    )
                ),
                $8
            )
            """,
            [
                (uuid4(), 1, 4, source_ids[0], "101", -101, 99, now),
                (uuid4(), 2, 7, uuid4(), "202", -202, 2, now),
            ],
        )
    finally:
        await connection.close()


async def _read_revisions(host: str, port: int) -> dict[int, int]:
    connection = await asyncpg.connect(
        host=host,
        port=port,
        user="postgres",
        password="postgres",
        database="postgres",
    )
    try:
        rows = await connection.fetch(
            "SELECT id, source_set_revision FROM tasks ORDER BY id"
        )
        return {int(row["id"]): int(row["source_set_revision"]) for row in rows}
    finally:
        await connection.close()


def test_migration_backfills_collision_free_revision_baselines():
    container = (
        DockerContainer("postgres:16-alpine")
        .with_env("POSTGRES_USER", "postgres")
        .with_env("POSTGRES_PASSWORD", "postgres")
        .with_env("POSTGRES_DB", "postgres")
        .with_exposed_ports(5432)
    )
    container.start()
    previous_env_url = os.environ.get("TASKS_DATABASE_URL")
    previous_settings_url = settings.database_url
    try:
        host = container.get_container_host_ip()
        port = int(container.get_exposed_port(5432))
        asyncio.run(_wait_for_postgres(host, port))
        database_url = (
            f"postgresql+asyncpg://postgres:postgres@{host}:{port}/postgres"
        )
        os.environ["TASKS_DATABASE_URL"] = database_url
        settings.database_url = database_url
        config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
        command.upgrade(config, "p1_task_run_snapshot")
        asyncio.run(_seed_pre_migration_data(host, port))

        command.upgrade(config, "head")

        assert asyncio.run(_read_revisions(host, port)) == {
            1: 5,
            2: 7,
            3: 1,
        }
        command.upgrade(config, "head")
    finally:
        settings.database_url = previous_settings_url
        if previous_env_url is None:
            os.environ.pop("TASKS_DATABASE_URL", None)
        else:
            os.environ["TASKS_DATABASE_URL"] = previous_env_url
        container.stop()
