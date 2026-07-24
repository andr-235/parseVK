"""Integration tests for the pg_trgm migration.

Verifies the migration is wired into the Alembic revision chain with the
correct parent and metadata. These tests do not require a running database;
they validate the migration script and chain structure only.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import asyncpg
import pytest
from alembic import command
from alembic.config import Config
from alembic.script import ScriptDirectory

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path  # noqa: E402

use_service_path()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="module")
def script() -> ScriptDirectory:
    """Provide the Alembic ScriptDirectory for the content-service."""
    service_root = Path(__file__).resolve().parent.parent
    alembic_ini = service_root / "alembic.ini"
    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(service_root / "alembic"))
    return ScriptDirectory.from_config(config)


def test_trigram_migration_revision_exists(script: ScriptDirectory) -> None:
    """Verify the trigram migration is reachable in the chain."""
    rev = script.get_revision("20260724_add_pg_trgm_index")
    assert rev is not None, (
        "Migration '20260724_add_pg_trgm_index' not found in the chain"
    )
    assert len(rev.revision) <= 32, (
        f"Revision {rev.revision!r} has {len(rev.revision)} characters, "
        f"expected <= 32"
    )
    assert rev.doc == "add pg_trgm extension and gin index on im_messages.text"


def test_trigram_migration_down_revision(script: ScriptDirectory) -> None:
    """Verify the trigram migration points to the correct parent."""
    rev = script.get_revision("20260724_add_pg_trgm_index")
    assert rev is not None
    assert rev.down_revision == "20260720_im_messages_projection", (
        f"Expected down_revision '20260720_im_messages_projection', "
        f"got {rev.down_revision!r}"
    )


def test_trigram_migration_is_head(script: ScriptDirectory) -> None:
    """Verify the trigram migration is the current single head."""
    heads = script.get_heads()
    assert len(heads) == 1, (
        f"Expected exactly one head, got {len(heads)}: {heads}"
    )
    assert heads[0] == "20260724_add_pg_trgm_index", (
        f"Expected head '20260724_add_pg_trgm_index', got {heads[0]!r}"
    )


def test_trigram_migration_has_index_name_constant(script: ScriptDirectory) -> None:
    """Verify the migration defines INDEX_NAME constant."""
    rev = script.get_revision("20260724_add_pg_trgm_index")
    assert rev is not None
    module = rev.module
    assert hasattr(module, "INDEX_NAME"), "Migration must define INDEX_NAME constant"
    assert module.INDEX_NAME == "ix_im_messages_text_trgm"


# ── Online integration tests (require PostgreSQL) ──────────────────────


class TestOnlineMigration:
    """Tests that require a running PostgreSQL database."""

    pytestmark = pytest.mark.skipif(
        not os.environ.get("CONTENT_DATABASE_URL"),
        reason="CONTENT_DATABASE_URL not set — skipping online migration tests",
    )

    @pytest.fixture(scope="function")
    def managed_db(self):
        """Run the migration up and down on a real DB, yield config and URL."""
        database_url = os.environ["CONTENT_DATABASE_URL"]
        service_root = Path(__file__).resolve().parent.parent
        alembic_cfg = Config(str(service_root / "alembic.ini"))
        alembic_cfg.set_main_option(
            "script_location", str(service_root / "alembic")
        )
        # Ensure a known baseline before each test.
        command.downgrade(alembic_cfg, "20260720_im_messages_projection")
        yield alembic_cfg, database_url
        # Clean up after the test.
        command.downgrade(alembic_cfg, "20260720_im_messages_projection")

    @pytest.mark.anyio
    async def test_upgrade_from_missing_index(self, managed_db):
        """When no index exists, upgrade creates a valid GIN index."""
        alembic_cfg, database_url = managed_db
        command.upgrade(alembic_cfg, "20260724_add_pg_trgm_index")
        conn = await asyncpg.connect(database_url)
        try:
            row = await conn.fetchrow(
                "SELECT i.indisvalid, i.indisready, am.amname "
                "FROM pg_index i "
                "JOIN pg_class idx ON idx.oid = i.indexrelid "
                "JOIN pg_class tbl ON tbl.oid = i.indrelid "
                "JOIN pg_am am ON am.oid = idx.relam "
                "WHERE idx.relname = 'ix_im_messages_text_trgm' "
                "  AND tbl.relname = 'im_messages'"
            )
            assert row is not None, "Index not found"
            assert row["indisvalid"] is True
            assert row["indisready"] is True
            assert row["amname"] == "gin"
        finally:
            await conn.close()

    @pytest.mark.anyio
    async def test_upgrade_recovers_invalid_index(self, managed_db):
        """When an invalid index exists, upgrade drops and recreates it."""
        alembic_cfg, database_url = managed_db
        conn = await asyncpg.connect(database_url)
        try:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
            await conn.execute(
                "CREATE INDEX ix_im_messages_text_trgm "
                "ON im_messages USING gin (text gin_trgm_ops)"
            )
            # Mark the index as invalid to simulate a failed CONCURRENTLY build.
            await conn.execute(
                "UPDATE pg_index SET indisvalid = false, indisready = false "
                "WHERE indexrelid = 'ix_im_messages_text_trgm'::regclass"
            )
        finally:
            await conn.close()

        command.upgrade(alembic_cfg, "20260724_add_pg_trgm_index")

        conn = await asyncpg.connect(database_url)
        try:
            row = await conn.fetchrow(
                "SELECT i.indisvalid, i.indisready, am.amname "
                "FROM pg_index i "
                "JOIN pg_class idx ON idx.oid = i.indexrelid "
                "JOIN pg_class tbl ON tbl.oid = i.indrelid "
                "JOIN pg_am am ON am.oid = idx.relam "
                "WHERE idx.relname = 'ix_im_messages_text_trgm' "
                "  AND tbl.relname = 'im_messages'"
            )
            assert row is not None, "Index not found after recovery"
            assert row["indisvalid"] is True
            assert row["indisready"] is True
            assert row["amname"] == "gin"
        finally:
            await conn.close()

    @pytest.mark.anyio
    async def test_extension_created(self, managed_db):
        """After upgrade, pg_trgm extension must exist."""
        alembic_cfg, database_url = managed_db
        command.upgrade(alembic_cfg, "20260724_add_pg_trgm_index")
        conn = await asyncpg.connect(database_url)
        try:
            row = await conn.fetchrow(
                "SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'"
            )
            assert row is not None, "pg_trgm extension not found"
        finally:
            await conn.close()

    @pytest.mark.anyio
    async def test_downgrade_removes_index(self, managed_db):
        """After downgrade, the index must be removed."""
        alembic_cfg, database_url = managed_db
        command.upgrade(alembic_cfg, "20260724_add_pg_trgm_index")
        command.downgrade(alembic_cfg, "20260720_im_messages_projection")
        conn = await asyncpg.connect(database_url)
        try:
            row = await conn.fetchrow(
                "SELECT 1 FROM pg_class WHERE relname = 'ix_im_messages_text_trgm'"
            )
            assert row is None, "Index still exists after downgrade"
        finally:
            await conn.close()
