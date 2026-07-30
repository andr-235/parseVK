from __future__ import annotations

import json
from pathlib import Path
from typing import cast

from parsevk_contracts.compatibility.models import CompatibilityCheckError, CompatibilityViolation


def _to_snake(camel: str) -> str:
    """Convert camelCase to snake_case for violation codes."""
    result = ""
    for char in camel:
        if char.isupper() and result:
            result += "_"
        result += char.lower()
    return result


def check_schema_unchanged(
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
        raise CompatibilityCheckError(
            f"Baseline schema is not valid JSON: {baseline_path}: {exc}"
        ) from exc
    try:
        current_schema = json.loads(current_path.read_bytes())
    except json.JSONDecodeError as exc:
        raise CompatibilityCheckError(
            f"Current schema is not valid JSON: {current_path}: {exc}"
        ) from exc
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


def check_field_unchanged(
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


def check_partition_key_unchanged(
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


def check_no_removals(
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