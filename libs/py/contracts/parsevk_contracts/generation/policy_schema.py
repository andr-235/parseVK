"""Backward-readable evolution checks for generated JSON Schemas."""

from __future__ import annotations

from typing import Any

from parsevk_contracts.generation.policy_constraints import (
    compare_scalar_constraints,
)

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

    violations.extend(compare_scalar_constraints(baseline, current, path))
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


def _compare_objects(
    baseline: dict[str, Any],
    current: dict[str, Any],
    baseline_root: dict[str, Any],
    current_root: dict[str, Any],
    path: str,
    violations: list[str],
    visited: set[tuple[int, int]],
) -> None:
    added_required = set(current.get("required", [])) - set(
        baseline.get("required", [])
    )
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
