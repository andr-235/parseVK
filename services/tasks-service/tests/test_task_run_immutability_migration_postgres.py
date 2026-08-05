import asyncio
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import asyncpg
import pytest
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


async def _seed_repairable_history(host: str, port: int):
    connection = await _connect(host, port)
    parent_id = uuid4()
    source_id = uuid4()
    try:
        now = datetime(2026, 8, 5, tzinfo=UTC)
        await connection.execute(
            """
            INSERT INTO tasks (
                id, owner_user_id, title, status, scope, mode, group_ids,
                post_limit, source, total_items, processed_items, progress,
                revision, source_set_revision, last_execution_sequence,
                created_at, updated_at
            ) VALUES (
                1, 'user-1', 'repairable', 'failed', 'selected',
                'recent_posts', ARRAY[]::bigint[], 25, 'manual', 0, 0, 0,
                4, 3, 0, $1, $1
            )
            """,
            now,
        )
        await connection.execute(
            """
            INSERT INTO monitoring_sources (
                id, owner_user_id, provider, source_type, external_id,
                owner_id, status, revision, created_at, updated_at
            ) VALUES (
                $1, 'user-1', 'vk', 'community', '777', -777,
                'active', 8, $2, $2
            )
            """,
            source_id,
            now,
        )
        await connection.execute(
            """
            INSERT INTO task_runs (
                id, task_id, run_revision, status, source_set_revision,
                snapshot_sha256, config_snapshot, source_set_snapshot,
                created_at
            ) VALUES (
                $1, 1, 2, 'failed', 3, repeat('a', 64),
                '{}'::jsonb, '[]'::jsonb, $2
            )
            """,
            parent_id,
            now,
        )
        await connection.execute(
            """
            INSERT INTO task_run_source_demands (
                id, task_run_id, source_id, status, payload, created_at
            ) VALUES (
                $1, $2, $3, 'failed', $4::jsonb, $5
            )
            """,
            uuid4(),
            parent_id,
            source_id,
            json.dumps(
                {
                    "sourceId": str(source_id),
                    "provider": "vk",
                    "sourceType": "community",
                    "externalId": "777",
                    "ownerId": -777,
                    "sourceRevision": 8,
                    "taskRevision": 4,
                }
            ),
            now,
        )
    finally:
        await connection.close()
    return parent_id, source_id


async def _verify_repair_and_constraints(host: str, port: int, parent_id) -> None:
    connection = await _connect(host, port)
    try:
        parent = await connection.fetchrow(
            """
            SELECT snapshot_sha256, config_snapshot, source_set_snapshot
            FROM task_runs WHERE id = $1
            """,
            parent_id,
        )
        assert parent is not None
        assert len(parent["snapshot_sha256"]) == 64
        assert parent["config_snapshot"]["taskRevision"] == 4
        assert parent["config_snapshot"]["postLimit"] == 25
        assert len(parent["source_set_snapshot"]) == 1

        await connection.execute(
            "UPDATE task_runs SET status = 'cancelled' WHERE id = $1",
            parent_id,
        )
        with pytest.raises(asyncpg.CheckViolationError):
            await connection.execute(
                """
                UPDATE task_runs
                SET config_snapshot = jsonb_set(
                    config_snapshot, '{postLimit}', '10'::jsonb
                )
                WHERE id = $1
                """,
                parent_id,
            )
        with pytest.raises(asyncpg.CheckViolationError):
            await connection.execute(
                """
                INSERT INTO task_runs (
                    id, task_id, run_revision, status, source_set_revision,
                    snapshot_sha256, config_snapshot, source_set_snapshot,
                    created_at
                ) VALUES (
                    $1, 1, 1, 'requested', 3, repeat('a', 64),
                    '{}'::jsonb, '[]'::jsonb, now()
                )
                """,
                uuid4(),
            )

        child_id = uuid4()
        await connection.execute(
            """
            INSERT INTO task_runs (
                id, task_id, run_revision, status, source_set_revision,
                snapshot_sha256, config_snapshot, source_set_snapshot,
                resumed_from_task_run_id, retry_reason, created_at
            )
            SELECT
                $1, task_id, run_revision + 1, 'requested',
                source_set_revision, snapshot_sha256, config_snapshot,
                source_set_snapshot, id, 'manual_resume', now()
            FROM task_runs WHERE id = $2
            """,
            child_id,
            parent_id,
        )
        child = await connection.fetchrow(
            """
            SELECT resumed_from_task_run_id, retry_reason
            FROM task_runs WHERE id = $1
            """,
            child_id,
        )
        assert child["resumed_from_task_run_id"] == parent_id
        assert child["retry_reason"] == "manual_resume"
    finally:
        await connection.close()


async def _seed_irreparable_run(host: str, port: int) -> None:
    connection = await _connect(host, port)
    try:
        await connection.execute(
            """
            INSERT INTO task_runs (
                id, task_id, run_revision, status, source_set_revision,
                snapshot_sha256, config_snapshot, source_set_snapshot,
                created_at
            ) VALUES (
                $1, 1, 1, 'failed', 3, repeat('a', 64),
                '{}'::jsonb, '[]'::jsonb, now()
            )
            """,
            uuid4(),
        )
    finally:
        await connection.close()


async def _connect(host: str, port: int):
    return await asyncpg.connect(
        host=host,
        port=port,
        user="postgres",
        password="postgres",
        database="postgres",
    )


def test_task_run_migration_repairs_and_enforces_immutability():
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
        command.upgrade(config, "p2h1_source_set_revision")
        parent_id, _ = asyncio.run(_seed_repairable_history(host, port))

        command.upgrade(config, "head")
        command.upgrade(config, "head")
        asyncio.run(_verify_repair_and_constraints(host, port, parent_id))

        command.downgrade(config, "p2h1_source_set_revision")
        asyncio.run(_seed_irreparable_run(host, port))
        with pytest.raises(RuntimeError, match="no reconstructable source snapshot"):
            command.upgrade(config, "head")
    finally:
        settings.database_url = previous_settings_url
        if previous_env_url is None:
            os.environ.pop("TASKS_DATABASE_URL", None)
        else:
            os.environ["TASKS_DATABASE_URL"] = previous_env_url
        container.stop()
