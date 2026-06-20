import importlib.util
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

MIGRATION = (
    Path(__file__).resolve().parents[1]
    / "alembic"
    / "versions"
    / "20260620_0006_add_im_message_identity.py"
)


def load_migration():
    spec = importlib.util.spec_from_file_location("content_migration_0006", MIGRATION)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_migration_creates_and_drops_identity_constraint():
    migration = load_migration()
    bind = MagicMock()
    bind.execute.return_value.first.return_value = None
    with (
        patch.object(migration.op, "get_bind", return_value=bind),
        patch.object(migration.op, "create_unique_constraint") as create,
        patch.object(migration.op, "drop_constraint") as drop,
    ):
        migration.upgrade()
        migration.downgrade()

    create.assert_called_once_with(
        "uq_im_messages_identity",
        "im_messages",
        ["messenger", "chat_external_id", "external_id"],
    )
    drop.assert_called_once_with(
        "uq_im_messages_identity",
        "im_messages",
        type_="unique",
    )


def test_migration_fails_fast_when_duplicates_exist():
    migration = load_migration()
    bind = MagicMock()
    bind.execute.return_value.first.return_value = ("whatsapp", "chat", "message")
    with patch.object(migration.op, "get_bind", return_value=bind):
        with pytest.raises(RuntimeError, match="Duplicate IM message identities"):
            migration.upgrade()
