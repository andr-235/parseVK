"""Tests for compatibility manifest loading."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from parsevk_contracts.compatibility import CompatibilityCheckError, check_compatibility

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


class TestManifestLoader:
    def test_baseline_manifest_missing(self, tmp_path: Path) -> None:
        baseline = tmp_path / "nonexistent"
        current = _make_current(tmp_path)
        with pytest.raises(CompatibilityCheckError, match="Manifest not found"):
            check_compatibility(baseline, current)

    def test_current_manifest_missing(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        current = tmp_path / "nonexistent"
        with pytest.raises(CompatibilityCheckError, match="Manifest not found"):
            check_compatibility(baseline, current)

    def test_invalid_json_manifest(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        current = tmp_path / "current"
        current.mkdir(parents=True, exist_ok=True)
        (current / "manifest.json").write_text("not json")
        with pytest.raises(CompatibilityCheckError, match="not valid JSON"):
            check_compatibility(baseline, current)

    def test_duplicate_identity_in_current(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        dup_manifest: dict[str, object] = {
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
        current = _make_current(tmp_path, dup_manifest)
        with pytest.raises(CompatibilityCheckError, match="duplicate identity"):
            check_compatibility(baseline, current)

    def test_baseline_duplicate_identity_fails(self, tmp_path: Path) -> None:
        dup_baseline: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    "messageType": "test.event",
                    "schemaVersion": 1,
                    "topic": "test.topic",
                    "producers": ["svc"],
                    "consumers": ["svc"],
                },
                {
                    "messageType": "test.event",
                    "schemaVersion": 1,
                    "topic": "test.topic",
                    "producers": ["svc"],
                    "consumers": ["svc"],
                },
            ],
        }
        baseline = tmp_path / "baseline"
        _write_manifest(baseline, dup_baseline)
        current = _make_current(tmp_path)
        with pytest.raises(CompatibilityCheckError, match="duplicate identity"):
            check_compatibility(baseline, current)

    def test_empty_message_type_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        bad: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    "messageType": "",
                    "schemaVersion": 1,
                    "topic": "test.topic",
                    "producers": ["svc"],
                    "consumers": ["svc"],
                },
            ],
        }
        current = _make_current(tmp_path, bad)
        with pytest.raises(CompatibilityCheckError, match="messageType"):
            check_compatibility(baseline, current)

    def test_bool_schema_version_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        bad: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    "messageType": "test.event",
                    "schemaVersion": True,
                    "topic": "test.topic",
                    "producers": ["svc"],
                    "consumers": ["svc"],
                },
            ],
        }
        current = _make_current(tmp_path, bad)
        with pytest.raises(CompatibilityCheckError, match="schemaVersion"):
            check_compatibility(baseline, current)

    def test_negative_schema_version_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        bad: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    "messageType": "test.event",
                    "schemaVersion": -1,
                    "topic": "test.topic",
                    "producers": ["svc"],
                    "consumers": ["svc"],
                },
            ],
        }
        current = _make_current(tmp_path, bad)
        with pytest.raises(CompatibilityCheckError, match="schemaVersion"):
            check_compatibility(baseline, current)

    def test_string_schema_version_fails(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        bad: dict[str, object] = {
            **BASELINE_MANIFEST,
            "contracts": [
                {
                    "messageType": "test.event",
                    "schemaVersion": "1",
                    "topic": "test.topic",
                    "producers": ["svc"],
                    "consumers": ["svc"],
                },
            ],
        }
        current = _make_current(tmp_path, bad)
        with pytest.raises(CompatibilityCheckError, match="schemaVersion"):
            check_compatibility(baseline, current)

    def test_schema_invalid_json_raises(self, tmp_path: Path) -> None:
        baseline = _make_baseline(tmp_path)
        current = _make_current(tmp_path)
        schema_dir = current / "json-schema" / "vk.execution.requested"
        (schema_dir / "1.json").write_text("not json")
        with pytest.raises(CompatibilityCheckError, match="not valid JSON"):
            check_compatibility(baseline, current)