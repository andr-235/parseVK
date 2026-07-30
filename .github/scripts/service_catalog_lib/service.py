from __future__ import annotations

import re
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .errors import CatalogError
from .schema import string_tuple

ENV_NAME_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]*$")


@dataclass(frozen=True)
class Migration:
    database_url_env: str
    compose_target: str

    @classmethod
    def from_value(cls, service_name: str, value: Any) -> Migration | None:
        if value is None:
            return None
        if not isinstance(value, dict):
            raise CatalogError(
                f"service {service_name!r} field 'migration' must be null or an object"
            )
        required = {"database_url_env", "compose_target"}
        missing = sorted(required - value.keys())
        unknown = sorted(value.keys() - required)
        if missing:
            raise CatalogError(
                f"service {service_name!r} migration is missing fields: "
                f"{', '.join(missing)}"
            )
        if unknown:
            raise CatalogError(
                f"service {service_name!r} migration has unknown fields: "
                f"{', '.join(unknown)}"
            )

        database_url_env = value["database_url_env"]
        compose_target = value["compose_target"]
        if not isinstance(database_url_env, str) or not ENV_NAME_PATTERN.fullmatch(
            database_url_env
        ):
            raise CatalogError(
                f"service {service_name!r} migration database_url_env "
                "must be an uppercase env name"
            )
        if not isinstance(compose_target, str) or not compose_target:
            raise CatalogError(
                f"service {service_name!r} migration compose_target "
                "must be a non-empty string"
            )
        return cls(database_url_env, compose_target)


@dataclass(frozen=True)
class Service:
    name: str
    kind: str
    path: str
    dockerfile: str
    change_paths: tuple[str, ...]
    pytest: bool
    dependency_audit: bool
    docker_scan: bool
    compose_build: tuple[str, ...]
    migration: Migration | None

    @classmethod
    def from_mapping(cls, name: str, value: Mapping[str, Any]) -> Service:
        required = {
            "kind",
            "path",
            "dockerfile",
            "change_paths",
            "pytest",
            "dependency_audit",
            "docker_scan",
            "compose_build",
            "migration",
        }
        missing = sorted(required - value.keys())
        unknown = sorted(value.keys() - required)
        if missing:
            raise CatalogError(
                f"service {name!r} is missing fields: {', '.join(missing)}"
            )
        if unknown:
            raise CatalogError(
                f"service {name!r} has unknown fields: {', '.join(unknown)}"
            )

        kind = value["kind"]
        if kind not in {"python", "frontend"}:
            raise CatalogError(f"service {name!r} has unsupported kind {kind!r}")
        change_paths = string_tuple(name, "change_paths", value["change_paths"])
        compose_build = string_tuple(name, "compose_build", value["compose_build"])
        if not change_paths or not compose_build:
            raise CatalogError(
                f"service {name!r} must define change paths and Compose build targets"
            )

        booleans: dict[str, bool] = {}
        for field in ("pytest", "dependency_audit", "docker_scan"):
            raw = value[field]
            if not isinstance(raw, bool):
                raise CatalogError(
                    f"service {name!r} field {field!r} must be boolean"
                )
            booleans[field] = raw
        for field in ("path", "dockerfile"):
            if not isinstance(value[field], str) or not value[field]:
                raise CatalogError(
                    f"service {name!r} field {field!r} must be a non-empty string"
                )

        migration = Migration.from_value(name, value["migration"])
        if migration is not None and kind != "python":
            raise CatalogError(
                f"service {name!r} cannot define migrations for kind {kind!r}"
            )
        return cls(
            name=name,
            kind=kind,
            path=value["path"],
            dockerfile=value["dockerfile"],
            change_paths=change_paths,
            compose_build=compose_build,
            migration=migration,
            **booleans,
        )
