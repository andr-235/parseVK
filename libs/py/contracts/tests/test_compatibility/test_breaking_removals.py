from __future__ import annotations

import json
from pathlib import Path

import pytest

from parsevk_contracts.compatibility import check_compatibility
from parsevk_contracts.compatibility.models import CompatibilityCheckError


def _write_manifest(directory: Path, contracts: list[dict[str, object]]) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    (directory / "manifest.json").write_text(
        json.dumps(
            {
                "manifestVersion": 1,
                "package": {"name": "parsevk-contracts", "version": "0.1.0"},
                "contracts": contracts,
            }
        )
    )


def _contract() -> dict[str, object]:
    return {
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
    }


def test_reviewed_identity_removal_is_allowed(tmp_path: Path) -> None:
    baseline = tmp_path / "baseline"
    current = tmp_path / "current"
    _write_manifest(baseline, [_contract()])
    _write_manifest(current, [])
    (tmp_path / "compatibility-breaks.json").write_text(
        json.dumps(
            {
                "removedContracts": [
                    {
                        "messageType": "vk.execution.requested",
                        "schemaVersion": 1,
                        "reason": "hard cutover",
                        "issue": "#411",
                    }
                ]
            }
        )
    )

    assert check_compatibility(baseline, current) == ()


def test_unreviewed_identity_removal_still_fails(tmp_path: Path) -> None:
    baseline = tmp_path / "baseline"
    current = tmp_path / "current"
    _write_manifest(baseline, [_contract()])
    _write_manifest(current, [])

    violations = check_compatibility(baseline, current)

    assert [violation.code for violation in violations] == ["identity_removed"]


def test_malformed_break_registry_fails_closed(tmp_path: Path) -> None:
    baseline = tmp_path / "baseline"
    current = tmp_path / "current"
    _write_manifest(baseline, [_contract()])
    _write_manifest(current, [])
    (tmp_path / "compatibility-breaks.json").write_text(
        '{"removedContracts": [{"messageType": "vk.execution.requested"}]}'
    )

    with pytest.raises(CompatibilityCheckError):
        check_compatibility(baseline, current)
