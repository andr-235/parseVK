"""Tests for content-service migration integrity.

Verifies:
- All revision IDs in the migration chain are <= 32 characters
- The ``20260720_drop_monitoring_groups`` revision ID is the shortened form
- The migration chain has exactly one head
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
    # Resolve script_location to an absolute path so that the
    # ScriptDirectory works regardless of the current working directory.
    config.set_main_option("script_location", str(service_root / "alembic"))
    return ScriptDirectory.from_config(config)


def test_all_revision_ids_max_length_32_chars(script: ScriptDirectory) -> None:
    """Verify every revision ID in the chain is <= 32 characters.

    Alembic internally limits revision IDs to 32 characters.
    """
    for revision in script.walk_revisions():
        rev_id = revision.revision
        assert len(rev_id) <= 32, (
            f"Revision {rev_id!r} has {len(rev_id)} characters, "
            f"expected <= 32"
        )


def test_drop_monitoring_groups_revision_id(script: ScriptDirectory) -> None:
    """Verify the drop_monitoring_groups revision ID is the shortened form.

    The original revision ID was 35 characters
    (``20260720_0001_drop_monitoring_groups``).
    After the fix it must be exactly ``20260720_drop_monitoring_groups``
    (31 characters).
    """
    rev = script.get_revision("20260720_drop_monitoring_groups")
    assert rev is not None, (
        "Revision '20260720_drop_monitoring_groups' not found "
        "in the migration chain"
    )
    assert rev.revision == "20260720_drop_monitoring_groups", (
        f"Expected revision ID '20260720_drop_monitoring_groups', "
        f"got {rev.revision!r}"
    )


def test_single_head(script: ScriptDirectory) -> None:
    """Verify the migration chain has exactly one head."""
    heads = script.get_heads()
    assert len(heads) == 1, (
        f"Expected exactly one head, got {len(heads)}: {heads}"
    )


def test_trigram_migration_revision_id(script: ScriptDirectory) -> None:
    """Verify the pg_trgm migration exists with a 32-char-compatible revision ID."""
    rev = script.get_revision("20260724_add_pg_trgm_index")
    assert rev is not None, (
        "Revision '20260724_add_pg_trgm_index' not found in the migration chain"
    )
    assert len(rev.revision) <= 32, (
        f"Revision {rev.revision!r} has {len(rev.revision)} characters, "
        f"expected <= 32"
    )
    assert rev.doc == "add pg_trgm extension and gin index on im_messages.text"
