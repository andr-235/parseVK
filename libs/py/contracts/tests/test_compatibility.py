"""Tests for contract compatibility checking."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from parsevk_contracts.compatibility import (
    CompatibilityCheckError,
    CompatibilityViolation,
    check_compatibility,
)

BASELINE_MANIFEST: dict[str, object] = {
    "manifestVersion": 1,
    "package": {"name": "parsevk-contracts", "version": "0.1.0"},
    "contracts": [
        {
            "messageType": "vk.execution.requested",
            "schemaVersion": 1,
            "topic": "parsevk.vk.commands",
            "producers": ["tasks-service"],
            "consumers": ["vk-service"],
            "correlationRequired": True,
            "correlationPath": "payload.executionId",
            "causationPolicy": "forbidden",
            "compatibility": "backward",
            "partitionKey": {"paths": ["payload.executionId"], "separator": ":"},
        },
    ],
}

BASELINE_SCHEMA: dict[str, object] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:parsevk:contract:vk.execution.requested:1",
    "type": "object",
    "title": "vk.execution.requested",
    "properties": {
        "messageType": {"const": "vk.execution.requested"},
        "schemaVersion": {"const": 1},
        "topic": {"type": "string"},
    },
    "required": ["messageType", "schemaVersion"],
}


def _write_manifest(directory: Path, data: dict[str, object]) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / "manifest.json"
    path.write_text(json.dumps(data, indent=2) + "\n")
    return path


def _write_schema(directory: Path, message_type: str, schema_version: int, data: dict[str, object]) -> Path:
    schema_dir = directory / "json-schema" / message_type
    schema_dir.mkdir(parents=True, exist_ok=True)
    path = schema_dir / f"{schema_version}.json"
    path.write_text(json.dumps(data, indent=2) + "\n")
    return path


def _make_baseline(tmp_path: Path) -> Path:
    """Create a standard baseline with one contract and its schema."""
    baseline = tmp_path / "baseline"
    _write_manifest(baseline, BASELINE_MANIFEST)
    _write_schema(baseline, "vk.execution.requested", 1, BASELINE_SCHEMA)
    return baseline


def _make_current(tmp_path: Path, manifest: dict[str, object] | None = None) -> Path:
    """Create a current directory with the given manifest (or identical to baseline)."""
    current = tmp_path / "current"
    data = manifest or BASELINE_MANIFEST
    _write_manifest(current, data)
    for contract in data.get("contracts", []):
        mt = str(contract["messageType"])
        sv = int(contract["schemaVersion"])
        _write_schema(current, mt, sv, BASELINE_SCHEMA)
    return current


class TestCompatibilityCheck:
    def test_identical_schemas_pass(self, tmp_path: Path) -> None:
        """Identical baseline and current produce no violations."""
        baseline = _make_baseline(tmp_path)
        current = _make_current(tmp_path)
        violations = check_compatibility(baseline, current)
        assert len(violations) == 0

    def test_new_message_type_pass(self, tmp_path: Path) -> None:
        """Adding a new message_type is allowed."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                *BASELINE_MANIFEST["contracts"],
                {
                    "messageType": "vk.execution.completed",
                    "schemaVersion": 1,
                    "topic": "parsevk.vk.events",
                    "producers": ["vk-service"],
                    "consumers": ["tasks-service"],
                    "correlationRequired": False,
                    "causationPolicy": "optional",
                    "compatibility": "backward",
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        assert len(violations) == 0

    def test_new_schema_version_pass(self, tmp_path: Path) -> None:
        """Adding a new schema_version for an existing message_type is allowed."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                *BASELINE_MANIFEST["contracts"],
                {
                    "messageType": "vk.execution.requested",
                    "schemaVersion": 2,
                    "topic": "parsevk.vk.commands",
                    "producers": ["tasks-service"],
                    "consumers": ["vk-service"],
                    "correlationRequired": True,
                    "correlationPath": "payload.executionId",
                    "causationPolicy": "forbidden",
                    "compatibility": "backward",
                    "partitionKey": {"paths": ["payload.executionId"], "separator": ":"},
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        assert len(violations) == 0

    def test_identity_removed_fails(self, tmp_path: Path) -> None:
        """Removing an existing contract identity is a violation."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {**BASELINE_MANIFEST, "contracts": []}
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "identity_removed" in codes

    def test_schema_changed_fails(self, tmp_path: Path) -> None:
        """Modifying an existing schema version is a violation."""
        baseline = _make_baseline(tmp_path)
        current = _make_current(tmp_path)
        # Modify the current schema
        modified_schema = {**BASELINE_SCHEMA}
        modified_schema["properties"] = {
            "messageType": {"const": "vk.execution.requested"},
            "schemaVersion": {"const": 1},
            "topic": {"type": "string"},
            "extraField": {"type": "string"},
        }
        _write_schema(current, "vk.execution.requested", 1, modified_schema)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "schema_changed" in codes

    def test_topic_changed_fails(self, tmp_path: Path) -> None:
        """Changing topic for an existing version is a violation."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "topic": "parsevk.vk.other",
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "topic_changed" in codes

    def test_partition_key_changed_fails(self, tmp_path: Path) -> None:
        """Changing partitionKey for an existing version is a violation."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "partitionKey": {"paths": ["payload.otherId"], "separator": ":"},
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "partition_key_changed" in codes

    def test_correlation_required_changed_fails(self, tmp_path: Path) -> None:
        """Changing correlationRequired is a violation."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "correlationRequired": False,
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "correlation_required_changed" in codes

    def test_causation_policy_changed_fails(self, tmp_path: Path) -> None:
        """Changing causationPolicy is a violation."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "causationPolicy": "optional",
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "causation_policy_changed" in codes

    def test_producer_removed_fails(self, tmp_path: Path) -> None:
        """Removing a producer is a violation."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "producers": [],
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "producers_removed" in codes

    def test_consumer_removed_fails(self, tmp_path: Path) -> None:
        """Removing a consumer is a violation."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "consumers": [],
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "consumers_removed" in codes

    def test_producer_added_pass(self, tmp_path: Path) -> None:
        """Adding a producer is allowed."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "producers": ["tasks-service", "new-service"],
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        # Only non-removal violations should matter (schema unchanged, etc.)
        prod_removed = [v for v in violations if v.code == "producers_removed"]
        assert len(prod_removed) == 0

    def test_consumer_added_pass(self, tmp_path: Path) -> None:
        """Adding a consumer is allowed."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "consumers": ["vk-service", "new-service"],
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        cons_removed = [v for v in violations if v.code == "consumers_removed"]
        assert len(cons_removed) == 0

    def test_baseline_manifest_missing(self, tmp_path: Path) -> None:
        """Missing baseline manifest raises CompatibilityCheckError."""
        baseline = tmp_path / "nonexistent"
        current = _make_current(tmp_path)
        with pytest.raises(CompatibilityCheckError, match="Manifest not found"):
            check_compatibility(baseline, current)

    def test_current_manifest_missing(self, tmp_path: Path) -> None:
        """Missing current manifest raises CompatibilityCheckError."""
        baseline = _make_baseline(tmp_path)
        current = tmp_path / "nonexistent"
        with pytest.raises(CompatibilityCheckError, match="Manifest not found"):
            check_compatibility(baseline, current)

    def test_duplicate_identity_in_current(self, tmp_path: Path) -> None:
        """Duplicate identity in current manifest is an operational violation."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                *BASELINE_MANIFEST["contracts"],
                {
                    "messageType": "vk.execution.requested",
                    "schemaVersion": 1,
                    "topic": "parsevk.vk.commands",
                    "producers": ["tasks-service"],
                    "consumers": ["vk-service"],
                    "correlationRequired": True,
                    "correlationPath": "payload.executionId",
                    "causationPolicy": "forbidden",
                    "compatibility": "backward",
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "duplicate_identity" in codes

    def test_invalid_json_manifest(self, tmp_path: Path) -> None:
        """Invalid JSON in manifest raises CompatibilityCheckError."""
        baseline = _make_baseline(tmp_path)
        current = tmp_path / "current"
        current.mkdir(parents=True, exist_ok=True)
        (current / "manifest.json").write_text("not json")
        with pytest.raises(CompatibilityCheckError, match="not valid JSON"):
            check_compatibility(baseline, current)

    def test_compatibility_violation_dataclass(self) -> None:
        """CompatibilityViolation is a frozen dataclass with all fields."""
        v = CompatibilityViolation(
            code="test_code",
            message_type="test.type",
            schema_version=1,
            field="test_field",
            detail="Test detail",
        )
        assert v.code == "test_code"
        assert v.message_type == "test.type"
        assert v.schema_version == 1
        assert v.field == "test_field"
        assert v.detail == "Test detail"

    def test_multiple_violations_collected(self, tmp_path: Path) -> None:
        """Multiple violations are all collected in a single check."""
        baseline = _make_baseline(tmp_path)
        current_manifest: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "topic": "changed.topic",
                    "causationPolicy": "optional",
                    "producers": [],
                    "consumers": [],
                },
            ],
        }
        current = _make_current(tmp_path, current_manifest)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "topic_changed" in codes
        assert "causation_policy_changed" in codes
        assert "producers_removed" in codes
        assert "consumers_removed" in codes