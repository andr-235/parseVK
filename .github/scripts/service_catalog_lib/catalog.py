from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path

from .errors import CatalogError
from .paths import path_matches
from .schema import purpose_paths, require_mapping
from .service import Service

PURPOSE_FIELDS = {
    "pytest": "pytest",
    "audit": "dependency_audit",
    "docker": "docker_scan",
}


@dataclass(frozen=True)
class Catalog:
    schema_version: int
    global_change_paths: Mapping[str, tuple[str, ...]]
    services: tuple[Service, ...]

    @classmethod
    def load(cls, path: Path) -> Catalog:
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            raise CatalogError(f"catalog does not exist: {path}") from exc
        except json.JSONDecodeError as exc:
            raise CatalogError(
                "catalog must use JSON-compatible YAML syntax: "
                f"{exc.msg} at line {exc.lineno}"
            ) from exc

        if not isinstance(raw, dict):
            raise CatalogError("catalog root must be an object")
        expected = {"schema_version", "global_change_paths", "services"}
        if set(raw) != expected:
            raise CatalogError(
                "catalog root fields must be exactly: "
                "schema_version, global_change_paths, services"
            )
        if raw["schema_version"] != 2:
            raise CatalogError(
                f"unsupported catalog schema version: {raw['schema_version']!r}"
            )

        services_raw = raw["services"]
        if not isinstance(services_raw, dict) or not services_raw:
            raise CatalogError("catalog services must be a non-empty object")
        services = tuple(
            Service.from_mapping(name, value)
            for name, value in sorted(services_raw.items())
            if require_mapping(name, value)
        )
        return cls(2, purpose_paths(raw["global_change_paths"]), services)

    def selected(self, purpose: str) -> tuple[Service, ...]:
        if purpose == "deploy":
            return self.services
        if purpose == "migration":
            return tuple(
                service for service in self.services if service.migration is not None
            )
        field = PURPOSE_FIELDS.get(purpose)
        if field is None:
            raise CatalogError(f"unsupported purpose: {purpose}")
        return tuple(service for service in self.services if getattr(service, field))

    def changed(
        self, purpose: str, changed_files: Sequence[str]
    ) -> tuple[Service, ...]:
        candidates = self.selected(purpose)
        global_paths = self.global_change_paths.get(purpose)
        if global_paths is None:
            raise CatalogError(
                f"global change paths are not configured for purpose: {purpose}"
            )
        if any(path_matches(path, global_paths) for path in changed_files):
            if purpose in {"pytest", "audit"}:
                return tuple(
                    service for service in candidates if service.kind == "python"
                )
            return candidates
        return tuple(
            service
            for service in candidates
            if any(path_matches(path, service.change_paths) for path in changed_files)
        )
