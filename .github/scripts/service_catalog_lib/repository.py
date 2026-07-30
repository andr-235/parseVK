from __future__ import annotations

from pathlib import Path

from .catalog import Catalog
from .compose import validate_compose
from .errors import CatalogError
from .paths import configured_path_exists
from .service import Service


def discover_python_services(repo_root: Path) -> set[str]:
    services_root = repo_root / "services"
    if not services_root.is_dir():
        raise CatalogError(f"services directory does not exist: {services_root}")
    return {
        path.parent.name
        for path in services_root.glob("*/pyproject.toml")
        if path.is_file()
    }


def discover_migration_services(repo_root: Path) -> set[str]:
    return {
        path.parent.name
        for path in (repo_root / "services").glob("*/alembic.ini")
        if path.is_file()
    }


def validate_repository(
    catalog: Catalog, repo_root: Path, compose_file: Path
) -> None:
    errors: list[str] = []
    for purpose, paths in catalog.global_change_paths.items():
        for configured in paths:
            if not configured_path_exists(repo_root, configured):
                errors.append(
                    f"global {purpose} change path does not exist: {configured}"
                )

    python_catalog = {
        service.name for service in catalog.services if service.kind == "python"
    }
    discovered_python = discover_python_services(repo_root)
    missing = sorted(discovered_python - python_catalog)
    stale = sorted(python_catalog - discovered_python)
    if missing:
        errors.append(f"Python services missing from catalog: {', '.join(missing)}")
    if stale:
        errors.append(
            f"Catalog Python services missing from repository: {', '.join(stale)}"
        )

    migration_catalog = {
        service.name for service in catalog.services if service.migration is not None
    }
    discovered_migrations = discover_migration_services(repo_root)
    missing = sorted(discovered_migrations - migration_catalog)
    stale = sorted(migration_catalog - discovered_migrations)
    if missing:
        errors.append(
            "Migration services missing migration metadata: " + ", ".join(missing)
        )
    if stale:
        errors.append(
            "Catalog migration services missing alembic.ini: " + ", ".join(stale)
        )

    build_targets: list[str] = []
    migration_targets: list[str] = []
    for service in catalog.services:
        errors.extend(_validate_service(service, repo_root))
        build_targets.extend(service.compose_build)
        if service.migration is not None:
            migration_targets.append(service.migration.compose_target)

    duplicates = sorted(
        {target for target in build_targets if build_targets.count(target) > 1}
    )
    if duplicates:
        errors.append(
            "Compose build targets assigned more than once: " + ", ".join(duplicates)
        )
    duplicates = sorted(
        {target for target in migration_targets if migration_targets.count(target) > 1}
    )
    if duplicates:
        errors.append(
            "Migration compose targets assigned more than once: "
            + ", ".join(duplicates)
        )

    errors.extend(validate_compose(catalog, repo_root, compose_file, build_targets))
    if errors:
        raise CatalogError(
            "service catalog validation failed:\n- " + "\n- ".join(errors)
        )


def _validate_service(service: Service, repo_root: Path) -> list[str]:
    errors: list[str] = []
    path = repo_root / service.path
    if not path.is_dir():
        errors.append(f"{service.name}: path does not exist: {service.path}")
    if not (repo_root / service.dockerfile).is_file():
        errors.append(
            f"{service.name}: Dockerfile does not exist: {service.dockerfile}"
        )
    expected = "pyproject.toml" if service.kind == "python" else "package.json"
    if not (path / expected).is_file():
        errors.append(f"{service.name}: {service.kind} service has no {expected}")
    for configured in service.change_paths:
        if not configured_path_exists(repo_root, configured):
            errors.append(f"{service.name}: change path does not exist: {configured}")

    migrate_targets = [
        target for target in service.compose_build if target.endswith("-migrate")
    ]
    if service.migration is None:
        if migrate_targets:
            errors.append(
                f"{service.name}: migration target exists without metadata: "
                f"{', '.join(migrate_targets)}"
            )
        return errors

    migration = service.migration
    if migration.compose_target not in service.compose_build:
        errors.append(
            f"{service.name}: migration target {migration.compose_target!r} "
            "is not present in compose_build"
        )
    if migrate_targets != [migration.compose_target]:
        errors.append(
            f"{service.name}: expected migration target {migration.compose_target!r}, "
            f"found {migrate_targets}"
        )
    for relative in ("alembic.ini", "alembic/env.py", "alembic/versions"):
        if not (path / relative).exists():
            errors.append(f"{service.name}: {relative} does not exist")
    versions = path / "alembic" / "versions"
    if versions.is_dir() and not any(
        item.is_file() and item.name != "__init__.py" for item in versions.glob("*.py")
    ):
        errors.append(f"{service.name}: alembic/versions contains no revisions")
    return errors
