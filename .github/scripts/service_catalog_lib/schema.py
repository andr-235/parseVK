from __future__ import annotations

from typing import Any

from .errors import CatalogError

PURPOSES = ("pytest", "audit", "docker", "deploy", "migration")


def require_mapping(name: str, value: Any) -> bool:
    if not isinstance(name, str) or not name:
        raise CatalogError("service names must be non-empty strings")
    if not isinstance(value, dict):
        raise CatalogError(f"service {name!r} must be an object")
    return True


def string_tuple(owner: str, field: str, raw: Any) -> tuple[str, ...]:
    if not isinstance(raw, list) or any(
        not isinstance(item, str) or not item for item in raw
    ):
        raise CatalogError(
            f"{owner!r} field {field!r} must be a list of non-empty strings"
        )
    if len(raw) != len(set(raw)):
        raise CatalogError(f"{owner!r} field {field!r} contains duplicates")
    return tuple(raw)


def purpose_paths(raw: Any) -> dict[str, tuple[str, ...]]:
    if not isinstance(raw, dict):
        raise CatalogError("global_change_paths must be an object keyed by purpose")
    if set(raw) != set(PURPOSES):
        raise CatalogError(
            f"global_change_paths keys must be exactly: {', '.join(PURPOSES)}"
        )
    return {
        purpose: string_tuple("global_change_paths", purpose, raw[purpose])
        for purpose in PURPOSES
    }
