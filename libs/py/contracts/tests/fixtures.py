"""Fixture loading helpers for contract tests."""

from __future__ import annotations

import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "examples"


def load_fixture(message_type: str, schema_version: int, case: str) -> dict[str, object]:
    """Load a JSON fixture by message_type, version, and case name."""
    path = FIXTURES_DIR / message_type / f"v{schema_version}" / f"{case}.json"
    if not path.exists():
        raise FileNotFoundError(f"Fixture not found: {path}")
    with open(path) as f:
        return json.load(f)
