from __future__ import annotations

import json
from collections.abc import Sequence

from .errors import CatalogError
from .service import Service


def service_matrix(services: Sequence[Service], purpose: str) -> str:
    if purpose in {"pytest", "audit"}:
        return json.dumps([service.name for service in services], separators=(",", ":"))
    if purpose == "docker":
        include = [
            {
                "service": service.name,
                "dockerfile": service.dockerfile,
                "image": f"parsevk-{service.name}:scan",
            }
            for service in services
        ]
        return json.dumps({"include": include}, separators=(",", ":"))
    if purpose == "migration":
        include = [
            {
                "service": service.name,
                "database_url_env": service.migration.database_url_env,
            }
            for service in services
            if service.migration is not None
        ]
        return json.dumps({"include": include}, separators=(",", ":"))
    raise CatalogError(f"matrix is not supported for purpose: {purpose}")


def deploy_targets(services: Sequence[Service]) -> list[str]:
    result: list[str] = []
    for service in services:
        for target in service.compose_build:
            if target not in result:
                result.append(target)
    return result
