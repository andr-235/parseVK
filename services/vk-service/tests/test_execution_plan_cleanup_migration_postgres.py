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

PARENT_REVISION = "pr6b2_quarantine_legacy_outbox"
LEGACY_COLUMNS = {"scope", "mode", "group_ids", "parent_execution_id"}


async def wait_for_postgres(host: str, port: int) -> None:
    last_error = None
    for _ in range(100):
        try:
            connection = await connect(host, port)
            await connection.close()
            return
        except (OSError, asyncpg.PostgresError) as exc:
            last_error = exc
            await asyncio.sleep(0.1)
    raise RuntimeError("PostgreSQL container did not become ready") from last_error


async def connect(host: str, port: int):
    return await asyncpg.connect(
        host=host,
        port=port,
        user="postgres",
        password="postgres",
        database="postgres",
    )


async def seed_execution(host: str, port: int):
    execution_id = uuid4()
    connection = await connect(host, port)
    try:
        now = datetime(2026, 8, 5, tzinfo=UTC)
        await connection.execute(
            """
            INSERT INTO vk_executions (
                id, task_id, owner_user_id, run_id, status, scope, mode,
                group_ids, post_limit, plan_snapshot, processed_items,
                total_items, available_at, current_fencing_token,
                execution_sequence, created_at, updated_at
            ) VALUES (
                $1, 42, 'user-1', 'run-42', 'pending', 'all',
                'legacy_mode', ARRAY[999]::bigint[], 10,
                '{"source":{"externalId":"12345"}}'::jsonb,
                0, 0, $2, 0, 0, $2, $2
            )
            """,
            execution_id,
            now,
        )
    finally:
        await connection.close()
    return execution_id


async def columns(host: str, port: int) -> set[str]:
    connection = await connect(host, port)
    try:
        rows = await connection.fetch(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'vk_executions'
            """
        )
        return {str(row["column_name"]) for row in rows}
    finally:
        await connection.close()


async def legacy_values(host: str, port: int, execution_id):
    connection = await connect(host, port)
    try:
        return await connection.fetchrow(
            """
            SELECT scope, mode, group_ids, parent_execution_id
            FROM vk_executions WHERE id = $1
            """,
            execution_id,
        )
    finally:
        await connection.close()


def test_execution_plan_cleanup_upgrade_rerun_and_downgrade():
    container = (
        DockerContainer("postgres:16-alpine")
        .with_env("POSTGRES_USER", "postgres")
        .with_env("POSTGRES_PASSWORD", "postgres")
        .with_env("POSTGRES_DB", "postgres")
        .with_exposed_ports(5432)
    )
    container.start()
    previous_env_url = os.environ.get("VK_SERVICE_DATABASE_URL")
    previous_settings_url = settings.database_url
    try:
        host = container.get_container_host_ip()
        port = int(container.get_exposed_port(5432))
        asyncio.run(wait_for_postgres(host, port))
        database_url = (
            f"postgresql+asyncpg://postgres:postgres@{host}:{port}/postgres"
        )
        os.environ["VK_SERVICE_DATABASE_URL"] = database_url
        settings.database_url = database_url
        config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))

        command.upgrade(config, PARENT_REVISION)
        execution_id = asyncio.run(seed_execution(host, port))
        command.upgrade(config, "head")
        command.upgrade(config, "head")
        assert LEGACY_COLUMNS.isdisjoint(asyncio.run(columns(host, port)))

        command.downgrade(config, PARENT_REVISION)
        assert LEGACY_COLUMNS <= asyncio.run(columns(host, port))
        restored = asyncio.run(legacy_values(host, port, execution_id))
        assert restored["scope"] == "selected"
        assert restored["mode"] == "recent_posts"
        assert restored["group_ids"] == [12345]
        assert restored["parent_execution_id"] is None

        command.upgrade(config, "head")
        assert LEGACY_COLUMNS.isdisjoint(asyncio.run(columns(host, port)))
    finally:
        settings.database_url = previous_settings_url
        if previous_env_url is None:
            os.environ.pop("VK_SERVICE_DATABASE_URL", None)
        else:
            os.environ["VK_SERVICE_DATABASE_URL"] = previous_env_url
        container.stop()
