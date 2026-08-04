"""Fixture loading helpers for contract tests."""

from __future__ import annotations

import json
from pathlib import Path

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "examples"


def load_fixture(message_type: str, case: str) -> dict[str, object]:
    """Load one unversioned JSON fixture by semantic message type."""
    path = FIXTURES_DIR / message_type / f"{case}.json"
    if not path.exists():
        raise FileNotFoundError(f"Fixture not found: {path}")
    with open(path) as file:
        return json.load(file)
