"""Test that generated artifacts are up to date with contracts."""

from __future__ import annotations

import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
GENERATED_DIR = HERE.parent / "generated"


def test_json_schema_no_drift() -> None:
    """Generated JSON Schema files match current contracts."""
    from parsevk_contracts.vk.commands import CATALOG
    from parsevk_contracts.generation.json_schema import generate_json_schema

    for contract in CATALOG.contracts:
        msg_type = contract.message_type
        schema_ver = contract.schema_version
        generated_path = GENERATED_DIR / msg_type / f"{schema_ver}.json"
        assert generated_path.exists(), f"Missing generated schema: {generated_path}"

        with open(generated_path) as f:
            generated = json.load(f)

        expected = generate_json_schema(contract)
        assert generated == expected, f"Drift detected in {msg_type} v{schema_ver}"


def test_manifest_no_drift() -> None:
    """Generated manifest matches current contracts."""
    from parsevk_contracts.vk.commands import CATALOG
    from parsevk_contracts.generation.manifest import generate_manifest

    generated_path = GENERATED_DIR / "manifest.json"
    assert generated_path.exists(), "Missing generated manifest"

    with open(generated_path) as f:
        generated = json.load(f)

    expected = generate_manifest(CATALOG)
    assert generated == expected, "Drift detected in manifest"
