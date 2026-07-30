"""Contract compatibility check between baseline and current generated artifacts.

Usage::

    violations = check_compatibility(
        baseline_dir=Path("path/to/baseline/generated"),
        current_dir=Path("generated"),
    )
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast


@dataclass(frozen=True, slots=True)
class CompatibilityViolation:
    """A single compatibility violation between baseline and current contracts."""

    code: str
    message_type: str
    schema_version: int
    field: str | None
    detail: str


class CompatibilityCheckError(Exception):
    """Operational error — the check itself could not complete (exit code 2)."""


def _load_manifest(path: Path) -> dict[str, object]:
    """Load and validate a manifest.json file."""
    if not path.exists():
        raise CompatibilityCheckError(f"Manifest not found: {path}")
    try:
        data = json.loads(path.read_bytes())
    except json.JSONDecodeError as exc:
        raise CompatibilityCheckError(
            f"Manifest is not valid JSON: {path}: {exc}"
        ) from exc
    if not isinstance(data, dict):
        raise CompatibilityCheckError(
            f"Manifest root must be a JSON object: {path}"
        )
    contracts = data.get("contracts")
    if not isinstance(contracts, list):
        raise CompatibilityCheckError(
            f"Manifest must contain a 'contracts' array: {path}"
        )
    for i, entry in enumerate(contracts):
        if not isinstance(entry, dict):
            raise CompatibilityCheckError(
                f"Manifest contract entry {i} is not a JSON object: {path}"
            )
        if "messageType" not in entry or "schemaVersion" not in entry:
            raise CompatibilityCheckError(
                f"Manifest contract entry {i} missing messageType/schemaVersion: {path}"
            )
    return data


def _check_duplicates_in_current(
    current_contracts: list[dict[str, object]],
    violations: list[CompatibilityViolation],
) -> None:
    """Detect duplicate identities in current manifest (operational error)."""
    seen: set[tuple[str, int]] = set()
    for entry in current_contracts:
        mt = str(entry.get("messageType", ""))
        sv = cast(int, entry.get("schemaVersion", 0))
        key = (mt, sv)
        if key in seen:
            violations.append(
                CompatibilityViolation(
                    code="duplicate_identity",
                    message_type=mt,
                    schema_version=sv,
                    field=None,
                    detail=f"Duplicate contract identity '{mt}' v{sv} in current manifest",
                )
            )
        seen.add(key)


def _check_schema_unchanged(
    baseline_path: Path,
    current_path: Path,
    message_type: str,
    schema_version: int,
    violations: list[CompatibilityViolation],
) -> None:
    """Compare JSON Schema files semantically (parsed objects, not bytes)."""
    if not baseline_path.exists():
        violations.append(
            CompatibilityViolation(
                code="schema_missing_in_baseline",
                message_type=message_type,
                schema_version=schema_version,
                field="schema",
                detail=f"JSON Schema file not found in baseline: {baseline_path}",
            )
        )
        return
    if not current_path.exists():
        violations.append(
            CompatibilityViolation(
                code="schema_missing_in_current",
                message_type=message_type,
                schema_version=schema_version,
                field="schema",
                detail=f"JSON Schema file not found in current: {current_path}",
            )
        )
        return
    try:
        baseline_schema = json.loads(baseline_path.read_bytes())
    except json.JSONDecodeError as exc:
        violations.append(
            CompatibilityViolation(
                code="schema_invalid_json",
                message_type=message_type,
                schema_version=schema_version,
                field="schema",
                detail=f"Baseline schema is not valid JSON: {exc}",
            )
        )
        return
    try:
        current_schema = json.loads(current_path.read_bytes())
    except json.JSONDecodeError as exc:
        violations.append(
            CompatibilityViolation(
                code="schema_invalid_json",
                message_type=message_type,
                schema_version=schema_version,
                field="schema",
                detail=f"Current schema is not valid JSON: {exc}",
            )
        )
        return
    if baseline_schema != current_schema:
        violations.append(
            CompatibilityViolation(
                code="schema_changed",
                message_type=message_type,
                schema_version=schema_version,
                field="schema",
                detail=(
                    f"JSON Schema for '{message_type}' v{schema_version} has changed. "
                    f"Create a new schema_version instead of modifying an existing one."
                ),
            )
        )


def _check_field_unchanged(
    baseline: dict[str, object],
    current: dict[str, object],
    field: str,
    violations: list[CompatibilityViolation],
    message_type: str,
    schema_version: int,
) -> None:
    """Assert a metadata field has not changed between baseline and current."""
    baseline_val = baseline.get(field)
    current_val = current.get(field)
    if baseline_val != current_val:
        violations.append(
            CompatibilityViolation(
                code=f"{_to_snake(field)}_changed",
                message_type=message_type,
                schema_version=schema_version,
                field=field,
                detail=(
                    f"'{field}' changed from '{baseline_val}' to '{current_val}' "
                    f"for '{message_type}' v{schema_version}. "
                    f"This field is immutable for an existing schema version."
                ),
            )
        )


def _to_snake(camel: str) -> str:
    """Convert camelCase to snake_case for violation codes."""
    result = ""
    for char in camel:
        if char.isupper() and result:
            result += "_"
        result += char.lower()
    return result


def _check_partition_key_unchanged(
    baseline: dict[str, object],
    current: dict[str, object],
    violations: list[CompatibilityViolation],
    message_type: str,
    schema_version: int,
) -> None:
    """Compare partitionKey entries (dict comparison)."""
    baseline_pk = baseline.get("partitionKey")
    current_pk = current.get("partitionKey")
    if baseline_pk != current_pk:
        violations.append(
            CompatibilityViolation(
                code="partition_key_changed",
                message_type=message_type,
                schema_version=schema_version,
                field="partitionKey",
                detail=(
                    f"partitionKey changed for '{message_type}' v{schema_version}. "
                    f"This field is immutable for an existing schema version."
                ),
            )
        )


def _check_no_removals(
    baseline: dict[str, object],
    current: dict[str, object],
    field: str,
    violations: list[CompatibilityViolation],
    message_type: str,
    schema_version: int,
) -> None:
    """Assert no entries were removed from a list field (producers, consumers)."""
    baseline_set = set(cast(list[str], baseline.get(field, [])))
    current_set = set(cast(list[str], current.get(field, [])))
    removed = baseline_set - current_set
    for item in sorted(removed):
        violations.append(
            CompatibilityViolation(
                code=f"{_to_snake(field)}_removed",
                message_type=message_type,
                schema_version=schema_version,
                field=field,
                detail=(
                    f"'{item}' removed from {field} of '{message_type}' v{schema_version}. "
                    f"Removing producers or consumers is not allowed for an existing schema version."
                ),
            )
        )


def check_compatibility(
    baseline_dir: Path,
    current_dir: Path,
) -> tuple[CompatibilityViolation, ...]:
    """Compare baseline and current generated contract artifacts.

    Returns all compatibility violations found (empty tuple means compatible).

    Raises *CompatibilityCheckError* when the check itself cannot complete
    (missing files, invalid JSON, etc.).

    Rules for existing ``(messageType, schemaVersion)`` identities:
    * the identity itself must not be removed;
    * the JSON Schema must not change (semantic object comparison);
    * ``topic``, ``partitionKey``, ``correlationRequired``, ``correlationPath``,
      ``causationPolicy``, and ``compatibility`` are immutable;
    * ``producers`` and ``consumers`` entries must not be removed (additions are
      allowed).

    New ``(messageType, schemaVersion)`` identities in the current manifest are
    always allowed.
    """
    violations: list[CompatibilityViolation] = []

    baseline_data = _load_manifest(baseline_dir / "manifest.json")
    current_data = _load_manifest(current_dir / "manifest.json")

    baseline_contracts: list[dict[str, object]] = cast(
        list[dict[str, object]], baseline_data.get("contracts", []),
    )
    current_contracts: list[dict[str, object]] = cast(
        list[dict[str, object]], current_data.get("contracts", []),
    )

    _check_duplicates_in_current(current_contracts, violations)

    current_by_identity: dict[tuple[str, int], dict[str, object]] = {}
    for entry in current_contracts:
        mt = str(entry.get("messageType", ""))
        sv = cast(int, entry.get("schemaVersion", 0))
        current_by_identity[(mt, sv)] = entry

    for baseline in baseline_contracts:
        mt = str(baseline.get("messageType", ""))
        sv = cast(int, baseline.get("schemaVersion", 0))
        identity = (mt, sv)

        if identity not in current_by_identity:
            violations.append(
                CompatibilityViolation(
                    code="identity_removed",
                    message_type=mt,
                    schema_version=sv,
                    field=None,
                    detail=(
                        f"Contract '{mt}' v{sv} exists in baseline "
                        f"but is missing from current"
                    ),
                )
            )
            continue

        current = current_by_identity[identity]

        schema_dir = baseline_dir / "json-schema" / mt
        baseline_schema_path = schema_dir / f"{sv}.json"
        current_schema_path = current_dir / "json-schema" / mt / f"{sv}.json"
        _check_schema_unchanged(baseline_schema_path, current_schema_path, mt, sv, violations)

        _check_field_unchanged(baseline, current, "topic", violations, mt, sv)
        _check_field_unchanged(baseline, current, "correlationRequired", violations, mt, sv)
        _check_field_unchanged(baseline, current, "correlationPath", violations, mt, sv)
        _check_field_unchanged(baseline, current, "causationPolicy", violations, mt, sv)
        _check_field_unchanged(baseline, current, "compatibility", violations, mt, sv)
        _check_partition_key_unchanged(baseline, current, violations, mt, sv)
        _check_no_removals(baseline, current, "producers", violations, mt, sv)
        _check_no_removals(baseline, current, "consumers", violations, mt, sv)

    return tuple(violations)