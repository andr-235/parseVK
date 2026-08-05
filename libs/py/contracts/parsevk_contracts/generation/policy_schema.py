"""Backward-readable evolution checks for generated JSON Schemas."""

from __future__ import annotations

from typing import Any

IGNORED_KEYS = frozenset(
    {
        "$id",
        "$schema",
        "$defs",
        "default",
        "description",
        "examples",
        "title",
    }
)
LOWER_BOUNDS = ("minimum", "exclusiveMinimum", "minLength", "minItems")
UPPER_BOUNDS = ("maximum", "exclusiveMaximum", "maxLength", "maxItems")
EXACT_IF_PRESENT = ("format", "pattern", "multipleOf")
COMBINATORS = ("allOf", "anyOf", "oneOf", "not", "if", "then", "else")


def schema_violations(
    baseline_root: dict[str, Any],
    current_root: dict[str, Any],
) -> tuple[str, ...]:
    violations: list[str] = []
    _compare(
        _resolve(baseline_root, baseline_root),
        _resolve(current_root, current_root),
        baseline_root,
        current_root,
        "$",
        violations,
        set(),
    )
    return tuple(sorted(set(violations)))


def _resolve(node: Any, root: dict[str, Any]) -> Any:
    while isinstance(node, dict) and set(node) == {"$ref"}:
        reference = node["$ref"]
        if not isinstance(reference, str) or not reference.startswith("#/"):
            return node
        target: Any = root
        for part in reference[2:].split("/"):
            target = target[part.replace("~1", "/").replace("~0", "~")]
        node = target
    return node


def _compare(
    baseline: Any,
    current: Any,
    baseline_root: dict[str, Any],
    current_root: dict[str, Any],
    path: str,
    violations: list[str],
    visited: set[tuple[int, int]],
) -> None:
    baseline = _resolve(baseline, baseline_root)
    current = _resolve(current, current_root)
    if not isinstance(baseline, dict) or not isinstance(current, dict):
        if baseline != current:
            violations.append(f"{path}: schema shape changed")
        return
    pair = (id(baseline), id(current))
    if pair in visited:
        return
    visited.add(pair)

    _compare_types(baseline, current, path, violations)
    _compare_values(baseline, current, path, violations)
    _compare_bounds(baseline, current, path, violations)
    _compare_objects(
        baseline,
        current,
        baseline_root,
        current_root,
        path,
        violations,
        visited,
    )
    _compare_child(
        "items",
        baseline,
        current,
        baseline_root,
        current_root,
        path,
        violations,
        visited,
    )
    for keyword in COMBINATORS:
        if keyword in current and current.get(keyword) != baseline.get(keyword):
            violations.append(f"{path}: combinator {keyword} changed")


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


def _compare_objects(
    baseline: dict[str, Any],
    current: dict[str, Any],
    baseline_root: dict[str, Any],
    current_root: dict[str, Any],
    path: str,
    violations: list[str],
    visited: set[tuple[int, int]],
) -> None:
    old_required = set(baseline.get("required", []))
    new_required = set(current.get("required", []))
    added_required = new_required - old_required
    if added_required:
        violations.append(f"{path}: required fields added: {sorted(added_required)}")

    old_properties = baseline.get("properties", {})
    new_properties = current.get("properties", {})
    for name, old_schema in old_properties.items():
        if name not in new_properties:
            violations.append(f"{path}.{name}: property was removed")
            continue
        _compare(
            old_schema,
            new_properties[name],
            baseline_root,
            current_root,
            f"{path}.{name}",
            violations,
            visited,
        )

    old_additional = baseline.get("additionalProperties", True)
    new_additional = current.get("additionalProperties", True)
    if old_additional is not False and new_additional is False:
        violations.append(f"{path}: additionalProperties was narrowed")


def _compare_child(
    key: str,
    baseline: dict[str, Any],
    current: dict[str, Any],
    baseline_root: dict[str, Any],
    current_root: dict[str, Any],
    path: str,
    violations: list[str],
    visited: set[tuple[int, int]],
) -> None:
    if key not in baseline:
        if key in current:
            violations.append(f"{path}: {key} was newly constrained")
        return
    if key not in current:
        return
    _compare(
        baseline[key],
        current[key],
        baseline_root,
        current_root,
        f"{path}.{key}",
        violations,
        visited,
    )
