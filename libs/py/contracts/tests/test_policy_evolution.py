from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

from parsevk_contracts.generation.policy_evolution import compare_generated_contracts


def base_schema() -> dict:
    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "messageType": {"const": "test.event"},
            "payload": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "id": {"type": "string", "minLength": 1},
                    "count": {"type": "integer", "minimum": 1},
                },
                "required": ["id"],
            },
        },
        "required": ["messageType", "payload"],
    }


def write_generated(root: Path, schema: dict, **overrides) -> None:
    schema_dir = root / "json-schema"
    schema_dir.mkdir(parents=True)
    contract = {
        "messageType": "test.event",
        "topic": "parsevk.test.events",
        "partitionKey": {"paths": ["payload.id"], "separator": ":"},
        "correlationRequired": False,
        "causationPolicy": "optional",
        "producers": ["producer"],
        "consumers": ["consumer"],
    }
    contract.update(overrides)
    (root / "manifest.json").write_text(
        json.dumps({"contracts": [contract]}),
        encoding="utf-8",
    )
    (schema_dir / "test.event.json").write_text(
        json.dumps(schema),
        encoding="utf-8",
    )


def compare(tmp_path: Path, current_schema: dict, **overrides) -> tuple[str, ...]:
    baseline = tmp_path / "baseline"
    current = tmp_path / "current"
    write_generated(baseline, base_schema())
    write_generated(current, current_schema, **overrides)
    return compare_generated_contracts(baseline, current)


def test_optional_addition_and_relaxed_constraint_are_compatible(tmp_path: Path):
    current = deepcopy(base_schema())
    payload = current["properties"]["payload"]
    payload["properties"]["note"] = {"type": ["string", "null"]}
    payload["properties"]["count"]["minimum"] = 0

    assert compare(tmp_path, current, producers=["producer", "new-producer"]) == ()


def test_required_field_addition_is_breaking(tmp_path: Path):
    current = deepcopy(base_schema())
    payload = current["properties"]["payload"]
    payload["properties"]["name"] = {"type": "string"}
    payload["required"].append("name")

    violations = compare(tmp_path, current)

    assert any("required fields added" in item for item in violations)


def test_property_removal_and_constraint_narrowing_are_breaking(tmp_path: Path):
    current = deepcopy(base_schema())
    payload = current["properties"]["payload"]
    del payload["properties"]["id"]
    payload["properties"]["count"]["minimum"] = 2

    violations = compare(tmp_path, current)

    assert any("property was removed" in item for item in violations)
    assert any("minimum was tightened" in item for item in violations)


def test_routing_and_allow_list_changes_are_breaking(tmp_path: Path):
    violations = compare(
        tmp_path,
        base_schema(),
        topic="parsevk.other.events",
        producers=[],
    )

    assert any("immutable manifest field topic" in item for item in violations)
    assert any("producers removed" in item for item in violations)


def test_removed_contract_identity_is_breaking(tmp_path: Path):
    baseline = tmp_path / "baseline"
    current = tmp_path / "current"
    write_generated(baseline, base_schema())
    (current / "json-schema").mkdir(parents=True)
    (current / "manifest.json").write_text(
        json.dumps({"contracts": []}),
        encoding="utf-8",
    )

    violations = compare_generated_contracts(baseline, current)

    assert violations == ("test.event: contract identity was removed",)
