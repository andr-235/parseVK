from __future__ import annotations

from pathlib import Path
from typing import cast

from parsevk_contracts.compatibility.loader import load_manifest
from parsevk_contracts.compatibility.models import CompatibilityViolation
from parsevk_contracts.compatibility.rules import (
    check_field_unchanged,
    check_no_removals,
    check_partition_key_unchanged,
    check_schema_unchanged,
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

    baseline_data = load_manifest(baseline_dir / "manifest.json")
    current_data = load_manifest(current_dir / "manifest.json")

    baseline_contracts: list[dict[str, object]] = cast(
        list[dict[str, object]], baseline_data.get("contracts", []),
    )
    current_contracts: list[dict[str, object]] = cast(
        list[dict[str, object]], current_data.get("contracts", []),
    )

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
        check_schema_unchanged(baseline_schema_path, current_schema_path, mt, sv, violations)

        check_field_unchanged(baseline, current, "topic", violations, mt, sv)
        check_field_unchanged(baseline, current, "correlationRequired", violations, mt, sv)
        check_field_unchanged(baseline, current, "correlationPath", violations, mt, sv)
        check_field_unchanged(baseline, current, "causationPolicy", violations, mt, sv)
        check_field_unchanged(baseline, current, "compatibility", violations, mt, sv)
        check_partition_key_unchanged(baseline, current, violations, mt, sv)
        check_no_removals(baseline, current, "producers", violations, mt, sv)
        check_no_removals(baseline, current, "consumers", violations, mt, sv)

    return tuple(violations)