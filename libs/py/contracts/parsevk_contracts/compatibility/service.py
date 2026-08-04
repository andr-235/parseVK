from __future__ import annotations

import json
from pathlib import Path
from typing import cast

from parsevk_contracts.compatibility.loader import load_manifest
from parsevk_contracts.compatibility.models import (
    CompatibilityCheckError,
    CompatibilityViolation,
)
from parsevk_contracts.compatibility.rules import (
    check_field_unchanged,
    check_no_removals,
    check_partition_key_unchanged,
    check_schema_unchanged,
)


def _allowed_removed_contracts(
    current_dir: Path,
) -> frozenset[tuple[str, int]]:
    """Load explicit, reviewed contract removals for a hard cutover."""

    path = current_dir.parent / "compatibility-breaks.json"
    if not path.exists():
        return frozenset()
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise CompatibilityCheckError(
            f"Compatibility break registry is invalid: {path}: {exc}"
        ) from exc

    entries = payload.get("removedContracts", [])
    if not isinstance(entries, list):
        raise CompatibilityCheckError(
            "compatibility-breaks.json removedContracts must be a list"
        )

    allowed: set[tuple[str, int]] = set()
    for entry in entries:
        if not isinstance(entry, dict):
            raise CompatibilityCheckError(
                "Each removed contract entry must be an object"
            )
        message_type = entry.get("messageType")
        schema_version = entry.get("schemaVersion")
        reason = entry.get("reason")
        issue = entry.get("issue")
        if (
            not isinstance(message_type, str)
            or not message_type
            or not isinstance(schema_version, int)
            or schema_version < 1
            or not isinstance(reason, str)
            or not reason
            or not isinstance(issue, str)
            or not issue
        ):
            raise CompatibilityCheckError(
                "Removed contract entries require messageType, positive "
                "schemaVersion, reason and issue"
            )
        allowed.add((message_type, schema_version))
    return frozenset(allowed)


def check_compatibility(
    baseline_dir: Path,
    current_dir: Path,
) -> tuple[CompatibilityViolation, ...]:
    """Compare baseline and current generated contract artifacts.

    Existing identities are immutable. Removal is accepted only when the
    current package contains an explicit reviewed hard-cutover entry in
    ``compatibility-breaks.json``. All other schema and metadata rules remain
    strict and cannot be suppressed by that registry.
    """
    violations: list[CompatibilityViolation] = []

    baseline_data = load_manifest(baseline_dir / "manifest.json")
    current_data = load_manifest(current_dir / "manifest.json")
    allowed_removals = _allowed_removed_contracts(current_dir)

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
            if identity in allowed_removals:
                continue
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
        check_schema_unchanged(
            baseline_schema_path,
            current_schema_path,
            mt,
            sv,
            violations,
        )

        check_field_unchanged(baseline, current, "topic", violations, mt, sv)
        check_field_unchanged(
            baseline,
            current,
            "correlationRequired",
            violations,
            mt,
            sv,
        )
        check_field_unchanged(
            baseline,
            current,
            "correlationPath",
            violations,
            mt,
            sv,
        )
        check_field_unchanged(
            baseline,
            current,
            "causationPolicy",
            violations,
            mt,
            sv,
        )
        check_field_unchanged(
            baseline,
            current,
            "compatibility",
            violations,
            mt,
            sv,
        )
        check_partition_key_unchanged(baseline, current, violations, mt, sv)
        check_no_removals(baseline, current, "producers", violations, mt, sv)
        check_no_removals(baseline, current, "consumers", violations, mt, sv)

    return tuple(violations)
