from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _service_path import use_service_path

use_service_path()

from app.modules.ingestion.canonical_helpers import author_update_fields


def test_stub_author_preserves_existing_profile_fields() -> None:
    stub = {
        "vkAuthorId": 30,
        "type": "user",
        "displayName": "30",
        "providerData": {},
    }
    assert author_update_fields(stub) == {"type"}


def test_complete_author_updates_only_present_profile_fields() -> None:
    author = {
        "vkAuthorId": 30,
        "type": "user",
        "displayName": "Alice",
        "providerData": {"first_name": "A", "photo_50": "", "domain": None},
    }
    assert author_update_fields(author) == {"type", "display_name", "first_name"}
