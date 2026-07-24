"""Integration tests for the pg_trgm migration.

Verifies the migration is wired into the Alembic revision chain with the
correct parent and metadata. These tests do not require a running database;
they validate the migration script and chain structure only.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path  # noqa: E402

use_service_path()


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
