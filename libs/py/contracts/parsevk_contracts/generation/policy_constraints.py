"""Scalar backward-readability rules for JSON Schema evolution."""

from __future__ import annotations

from typing import Any

LOWER_BOUNDS = ("minimum", "exclusiveMinimum", "minLength", "minItems")
UPPER_BOUNDS = ("maximum", "exclusiveMaximum", "maxLength", "maxItems")
EXACT_IF_PRESENT = ("format", "pattern", "multipleOf")


def compare_scalar_constraints(
    baseline: dict[str, Any],
    current: dict[str, Any],
    path: str,
) -> tuple[str, ...]:
    violations: list[str] = []
    _compare_types(baseline, current, path, violations)
    _compare_values(baseline, current, path, violations)
    _compare_bounds(baseline, current, path, violations)
    return tuple(violations)


def _type_set(schema: dict[str, Any]) -> set[str] | None:
    value = schema.get("type")
    if value is None:
        return None
    if isinstance(value, list):
        return {str(item) for item in value}
    return {str(value)}


def _compare_types(
    baseline: dict[str, Any],
    current: dict[str, Any],
    path: str,
    violations: list[str],
) -> None:
    old = _type_set(baseline)
    new = _type_set(current)
    if new is not None and (old is None or not old.issubset(new)):
        violations.append(f"{path}: accepted JSON types were narrowed")


def _compare_values(
    baseline: dict[str, Any],
    current: dict[str, Any],
    path: str,
    violations: list[str],
) -> None:
    if "const" in current and current.get("const") != baseline.get("const"):
        violations.append(f"{path}: const changed or was newly required")
    old_enum = baseline.get("enum")
    new_enum = current.get("enum")
    if new_enum is not None and (
        old_enum is None or not set(old_enum).issubset(set(new_enum))
    ):
        violations.append(f"{path}: enum values were narrowed")
    for keyword in EXACT_IF_PRESENT:
        if keyword in current and current.get(keyword) != baseline.get(keyword):
            violations.append(f"{path}: {keyword} changed or was newly constrained")


def _compare_bounds(
    baseline: dict[str, Any],
    current: dict[str, Any],
    path: str,
    violations: list[str],
) -> None:
    for keyword in LOWER_BOUNDS:
        if keyword not in current:
            continue
        if keyword not in baseline or current[keyword] > baseline[keyword]:
            violations.append(f"{path}: {keyword} was tightened")
    for keyword in UPPER_BOUNDS:
        if keyword not in current:
            continue
        if keyword not in baseline or current[keyword] < baseline[keyword]:
            violations.append(f"{path}: {keyword} was tightened")
