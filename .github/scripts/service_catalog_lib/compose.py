from __future__ import annotations

import json
import subprocess
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

from .catalog import Catalog
from .errors import CatalogError
from .git_changes import executable


def compose_model(repo_root: Path, compose_file: Path) -> Mapping[str, Any]:
    result = subprocess.run(  # noqa: S603 - executable resolved from trusted PATH
        [
            executable("docker"),
            "compose",
            "-f",
            str(compose_file),
            "config",
            "--format",
            "json",
        ],
        cwd=repo_root,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        details = result.stderr.strip() or result.stdout.strip()
        raise CatalogError(f"docker compose config failed: {details}")
    try:
        model = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise CatalogError("docker compose config did not return valid JSON") from exc
    if not isinstance(model, dict):
        raise CatalogError("docker compose config root must be an object")
    return model


def command_text(config: Mapping[str, Any]) -> str:
    command = config.get("command")
    if isinstance(command, str):
        return command
    if isinstance(command, list) and all(isinstance(item, str) for item in command):
        return " ".join(command)
    return ""


def validate_compose(
    catalog: Catalog,
    repo_root: Path,
    compose_file: Path,
    build_targets: Sequence[str],
) -> list[str]:
    errors: list[str] = []
    model = compose_model(repo_root, compose_file)
    compose_services = model.get("services")
    if not isinstance(compose_services, dict):
        return ["Compose model does not contain a services object"]

    configured_targets = set(build_targets)
    missing = sorted(configured_targets - compose_services.keys())
    if missing:
        errors.append(f"Catalog compose targets missing from Compose: {', '.join(missing)}")
    buildable = {
        name
        for name, config in compose_services.items()
        if isinstance(config, dict) and "build" in config
    }
    uncatalogued = sorted(buildable - configured_targets)
    if uncatalogued:
        errors.append(
            f"Buildable Compose services missing from catalog: {', '.join(uncatalogued)}"
        )

    for service in catalog.selected("migration"):
        assert service.migration is not None
        target = service.migration.compose_target
        config = compose_services.get(target)
        if not isinstance(config, dict):
            continue
        command = command_text(config)
        if "alembic" not in command or "upgrade" not in command:
            errors.append(
                f"{service.name}: Compose migration target {target!r} "
                "must run alembic upgrade"
            )
        environment = config.get("environment")
        if (
            not isinstance(environment, dict)
            or service.migration.database_url_env not in environment
        ):
            errors.append(
                f"{service.name}: Compose migration target {target!r} does not expose "
                f"{service.migration.database_url_env}"
            )
    return errors
