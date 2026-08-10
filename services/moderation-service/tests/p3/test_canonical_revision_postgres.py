from __future__ import annotations

import asyncio
import sys
from pathlib import Path

import asyncpg
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from testcontainers.core.container import DockerContainer

TEST_DIR = Path(__file__).resolve().parent
TESTS_DIR = TEST_DIR.parent
sys.path.insert(0, str(TESTS_DIR))
from _service_path import use_service_path

use_service_path()

from app.db.base import Base
from app.db.models import ModerationComment
from app.modules.moderation.crud_service import ModerationCrudService
from app.modules.moderation.projection_models import CanonicalCommentRevision

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


def _payload(text: str, matches: list[str]) -> dict:
    return {
        "external_key": "vk_-1_2_3",
        "post_external_key": "vk_-1_2",
        "text": text,
        "date": None,
        "author_vk_id": 42,
        "source": "VK",
        "matched_keywords": matches,
    }


@pytest.mark.asyncio
async def test_postgres_revision_checkpoint_rejects_stale_and_hides_newer_unmatched() -> None:
    postgres = (
        DockerContainer("postgres:16-alpine")
        .with_env("POSTGRES_USER", "postgres")
        .with_env("POSTGRES_PASSWORD", "postgres")
        .with_env("POSTGRES_DB", "postgres")
        .with_exposed_ports(5432)
    )
    postgres.start()
    engine = None
    try:
        host = postgres.get_container_host_ip()
        port = int(postgres.get_exposed_port(5432))
        await _wait_for_postgres(host, port)
        engine = create_async_engine(
            f"postgresql+asyncpg://postgres:postgres@{host}:{port}/postgres",
            pool_pre_ping=True,
        )
        sessions = async_sessionmaker(engine, expire_on_commit=False)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with sessions() as session:
            async with session.begin():
                crud = ModerationCrudService(session, on_enrich=lambda rows: rows)
                assert await crud.apply_canonical_comment(
                    _payload("опасно новое", ["опасно"]),
                    2,
                ) is True
                assert await crud.apply_canonical_comment(
                    _payload("опасно старое", ["опасно"]),
                    1,
                ) is False

        async with sessions() as session:
            row = await session.scalar(
                select(ModerationComment).where(
                    ModerationComment.external_key == "vk_-1_2_3"
                )
            )
            checkpoint = await session.get(
                CanonicalCommentRevision,
                "vk_-1_2_3",
            )
            assert row is not None
            assert row.text == "опасно новое"
            assert checkpoint is not None
            assert checkpoint.post_revision == 2

        async with sessions() as session:
            async with session.begin():
                crud = ModerationCrudService(session, on_enrich=lambda rows: rows)
                assert await crud.apply_canonical_comment(
                    _payload("теперь обычно", []),
                    3,
                ) is True
                assert await crud.apply_canonical_comment(
                    _payload("reconcile snapshot", []),
                    3,
                    allow_equal_revision=True,
                ) is True

        async with sessions() as session:
            row = await session.scalar(
                select(ModerationComment).where(
                    ModerationComment.external_key == "vk_-1_2_3"
                )
            )
            checkpoint = await session.get(
                CanonicalCommentRevision,
                "vk_-1_2_3",
            )
            assert row is not None
            assert row.text == "reconcile snapshot"
            assert row.matched_keywords == []
            assert checkpoint is not None
            assert checkpoint.post_revision == 3
    finally:
        if engine is not None:
            await engine.dispose()
        postgres.stop()
