"""Tests for compatibility rules (schema, fields, producers, consumers)."""

from __future__ import annotations

import json
from pathlib import Path

from parsevk_contracts.compatibility import check_compatibility

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
    baseline = tmp_path / "baseline"
    _write_manifest(baseline, BASELINE_MANIFEST)
    _write_schema(baseline, "vk.execution.requested", 1, BASELINE_SCHEMA)
    return baseline


def _make_current(tmp_path: Path, manifest: dict[str, object] | None = None) -> Path:
    current = tmp_path / "current"
    data = manifest or BASELINE_MANIFEST
    _write_manifest(current, data)
    for contract in data.get("contracts", []):
        mt = str(contract["messageType"])
        sv = int(contract["schemaVersion"])
        _write_schema(current, mt, sv, BASELINE_SCHEMA)
    return current


class TestRules:
    def test_identical_schemas_pass(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        current = _make_current(tmp_path)
        violations = check_compatibility(baseline, current)
        assert len(violations) == 0

    def test_schema_changed_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        current = _make_current(tmp_path)
        modified = {**BASELINE_SCHEMA}
        modified["properties"] = {
            "messageType": {"const": "vk.execution.requested"},
            "schemaVersion": {"const": 1},
            "topic": {"type": "string"},
            "extraField": {"type": "string"},
        }
        _write_schema(current, "vk.execution.requested", 1, modified)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "schema_changed" in codes

    def test_topic_changed_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        modified: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "topic": "parsevk.vk.other",
                },
            ],
        }
        current = _make_current(tmp_path, modified)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "topic_changed" in codes

    def test_partition_key_changed_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        modified: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "partitionKey": {"paths": ["payload.otherId"], "separator": ":"},
                },
            ],
        }
        current = _make_current(tmp_path, modified)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "partition_key_changed" in codes

    def test_correlation_required_changed_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        modified: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "correlationRequired": False,
                },
            ],
        }
        current = _make_current(tmp_path, modified)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "correlation_required_changed" in codes

    def test_causation_policy_changed_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        modified: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "causationPolicy": "optional",
                },
            ],
        }
        current = _make_current(tmp_path, modified)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "causation_policy_changed" in codes

    def test_producer_removed_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        modified: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "producers": [],
                },
            ],
        }
        current = _make_current(tmp_path, modified)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "producers_removed" in codes

    def test_consumer_removed_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        modified: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "consumers": [],
                },
            ],
        }
        current = _make_current(tmp_path, modified)
        violations = check_compatibility(baseline, current)
        codes = [v.code for v in violations]
        assert "consumers_removed" in codes

    def test_producer_added_pass(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        modified: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "producers": ["tasks-service", "new-service"],
                },
            ],
        }
        current = _make_current(tmp_path, modified)
        violations = check_compatibility(baseline, current)
        assert violations == ()

    def test_consumer_added_pass(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        modified: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    **BASELINE_MANIFEST["contracts"][0],
                    "consumers": ["vk-service", "new-service"],
                },
            ],
        }
        current = _make_current(tmp_path, modified)
        violations = check_compatibility(baseline, current)
        assert violations == ()