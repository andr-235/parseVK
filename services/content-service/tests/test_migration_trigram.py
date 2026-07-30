"""Regression tests for the pg_trgm migration."""

from pathlib import Path

from alembic.config import Config
from alembic.script import ScriptDirectory

PROJECT_ROOT = Path(__file__).resolve().parents[1]
TARGET_REVISION = "20260724_add_pg_trgm_index"


def _script() -> ScriptDirectory:
    config = Config(str(PROJECT_ROOT / "alembic.ini"))
    return ScriptDirectory.from_config(config)


def _ancestor_ids(script: ScriptDirectory, head: str) -> set[str]:
    pending = [head]
    seen: set[str] = set()
    while pending:
        revision_id = pending.pop()
        if revision_id in seen:
            continue
        seen.add(revision_id)
        revision = script.get_revision(revision_id)
        down_revision = revision.down_revision
        if isinstance(down_revision, tuple):
            pending.extend(down_revision)
        elif down_revision is not None:
            pending.append(down_revision)
    return seen


def test_trigram_migration_is_ancestor_of_head() -> None:
    script = _script()
    heads = script.get_heads()
    assert len(heads) == 1, f"Expected exactly one head, got {len(heads)}: {heads}"
    assert TARGET_REVISION in _ancestor_ids(script, heads[0])


def test_trigram_migration_contains_expected_index_operations() -> None:
    revision = _script().get_revision(TARGET_REVISION)
    source = Path(revision.path).read_text(encoding="utf-8")
    assert "CREATE EXTENSION IF NOT EXISTS pg_trgm" in source
    assert "ix_im_messages_text_trgm" in source
    assert "ON im_messages USING gin (text gin_trgm_ops)" in source
