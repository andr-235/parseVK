"""Evolution policy for unversioned semantic contract identities."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from parsevk_contracts.generation.policy_schema import schema_violations

IMMUTABLE_METADATA = (
    "topic",
    "partitionKey",
    "correlationRequired",
    "correlationPath",
    "causationPolicy",
)


def compare_generated_contracts(
    baseline_dir: Path,
    current_dir: Path,
) -> tuple[str, ...]:
    """Reject breaking changes under an existing semantic message type."""
    violations: list[str] = []
    baseline = _contracts_by_type(baseline_dir)
    current = _contracts_by_type(current_dir)

    for message_type in sorted(baseline.keys() - current.keys()):
        violations.append(f"{message_type}: contract identity was removed")

    for message_type in sorted(baseline.keys() & current.keys()):
        old = baseline[message_type]
        new = current[message_type]
        for field in IMMUTABLE_METADATA:
            if old.get(field) != new.get(field):
                violations.append(
                    f"{message_type}: immutable manifest field {field} changed"
                )
        _check_allow_list(
            message_type,
            "producers",
            old,
            new,
            violations,
        )
        _check_allow_list(
            message_type,
            "consumers",
            old,
            new,
            violations,
        )

        old_schema = _load_schema(baseline_dir, message_type)
        new_schema = _load_schema(current_dir, message_type)
        if old_schema is None:
            violations.append(f"{message_type}: baseline schema is missing")
            continue
        if new_schema is None:
            violations.append(f"{message_type}: current schema is missing")
            continue
        for detail in schema_violations(old_schema, new_schema):
            violations.append(f"{message_type}: {detail}")

    return tuple(sorted(set(violations)))


def _manifest_path(generated_dir: Path) -> Path:
    return generated_dir / "manifest.json"


def _contracts_by_type(generated_dir: Path) -> dict[str, dict[str, Any]]:
    manifest_path = _manifest_path(generated_dir)
    if not manifest_path.is_file():
        raise FileNotFoundError(f"manifest is missing: {manifest_path}")
    payload = json.loads(manifest_path.read_text(encoding="utf-8"))
    contracts: dict[str, dict[str, Any]] = {}
    for contract in payload.get("contracts", []):
        message_type = str(contract.get("messageType") or "")
        if not message_type:
            raise ValueError(f"manifest has contract without messageType: {manifest_path}")
        if message_type in contracts:
            raise ValueError(f"manifest has duplicate messageType: {message_type}")
        contracts[message_type] = dict(contract)
    return contracts


def _schema_path(generated_dir: Path, message_type: str) -> Path:
    return generated_dir / "json-schema" / f"{message_type}.json"


def _load_schema(
    generated_dir: Path,
    message_type: str,
) -> dict[str, Any] | None:
    path = _schema_path(generated_dir, message_type)
    if not path.is_file():
        return None
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"schema root must be an object: {path}")
    return payload


def _check_allow_list(
    message_type: str,
    field: str,
    old: dict[str, Any],
    new: dict[str, Any],
    violations: list[str],
) -> None:
    removed = set(old.get(field, [])) - set(new.get(field, []))
    if removed:
        violations.append(
            f"{message_type}: {field} removed: {sorted(removed)}"
        )
