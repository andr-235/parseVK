#!/usr/bin/env python3
"""Read and validate the parseVK service catalog without third-party packages.

The catalog is stored as JSON-compatible YAML 1.2. JSON is a strict subset of
YAML, so the CLI can use Python's standard library on every GitHub runner.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

CATALOG_PATH = Path(".github/service-catalog.yaml")
PURPOSE_FIELDS = {
    "pytest": "pytest",
    "audit": "dependency_audit",
    "docker": "docker_scan",
}
PURPOSES = ("pytest", "audit", "docker", "deploy", "migration")
ENV_NAME_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]*$")


class CatalogError(RuntimeError):
    """Raised when the service catalog or repository contract is invalid."""


@dataclass(frozen=True)
class Migration:
    database_url_env: str
    compose_target: str

    @classmethod
    def from_value(cls, service_name: str, value: Any) -> Migration | None:
        if value is None:
            return None
        if not isinstance(value, dict):
            raise CatalogError(f"service {service_name!r} field 'migration' must be null or an object")
        required = {"database_url_env", "compose_target"}
        missing = sorted(required - value.keys())
        unknown = sorted(value.keys() - required)
        if missing:
            raise CatalogError(
                f"service {service_name!r} migration is missing fields: {', '.join(missing)}"
            )
        if unknown:
            raise CatalogError(
                f"service {service_name!r} migration has unknown fields: {', '.join(unknown)}"
            )

        database_url_env = value["database_url_env"]
        compose_target = value["compose_target"]
        if not isinstance(database_url_env, str) or not ENV_NAME_PATTERN.fullmatch(database_url_env):
            raise CatalogError(
                f"service {service_name!r} migration database_url_env must be an uppercase env name"
            )
        if not isinstance(compose_target, str) or not compose_target:
            raise CatalogError(
                f"service {service_name!r} migration compose_target must be a non-empty string"
            )
        return cls(database_url_env=database_url_env, compose_target=compose_target)


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
            raise CatalogError(f"service {name!r} is missing fields: {', '.join(missing)}")
        if unknown:
            raise CatalogError(f"service {name!r} has unknown fields: {', '.join(unknown)}")

        kind = value["kind"]
        if kind not in {"python", "frontend"}:
            raise CatalogError(f"service {name!r} has unsupported kind {kind!r}")

        change_paths = _string_tuple(name, "change_paths", value["change_paths"])
        compose_build = _string_tuple(name, "compose_build", value["compose_build"])
        if not change_paths:
            raise CatalogError(f"service {name!r} must define at least one change path")
        if not compose_build:
            raise CatalogError(f"service {name!r} must define at least one compose build target")

        booleans: dict[str, bool] = {}
        for field in ("pytest", "dependency_audit", "docker_scan"):
            raw = value[field]
            if not isinstance(raw, bool):
                raise CatalogError(f"service {name!r} field {field!r} must be boolean")
            booleans[field] = raw

        for field in ("path", "dockerfile"):
            if not isinstance(value[field], str) or not value[field]:
                raise CatalogError(f"service {name!r} field {field!r} must be a non-empty string")

        migration = Migration.from_value(name, value["migration"])
        if migration is not None and kind != "python":
            raise CatalogError(f"service {name!r} cannot define migrations for kind {kind!r}")

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
                f"catalog must use JSON-compatible YAML syntax: {exc.msg} at line {exc.lineno}"
            ) from exc

        if not isinstance(raw, dict):
            raise CatalogError("catalog root must be an object")
        if set(raw) != {"schema_version", "global_change_paths", "services"}:
            raise CatalogError(
                "catalog root fields must be exactly: schema_version, global_change_paths, services"
            )
        if raw["schema_version"] != 2:
            raise CatalogError(f"unsupported catalog schema version: {raw['schema_version']!r}")

        global_paths = _purpose_paths(raw["global_change_paths"])
        services_raw = raw["services"]
        if not isinstance(services_raw, dict) or not services_raw:
            raise CatalogError("catalog services must be a non-empty object")

        services = tuple(
            Service.from_mapping(name, value)
            for name, value in sorted(services_raw.items())
            if _require_mapping(name, value)
        )
        return cls(2, global_paths, services)

    def selected(self, purpose: str) -> tuple[Service, ...]:
        if purpose == "deploy":
            return self.services
        if purpose == "migration":
            return tuple(service for service in self.services if service.migration is not None)
        field = PURPOSE_FIELDS.get(purpose)
        if field is None:
            raise CatalogError(f"unsupported purpose: {purpose}")
        return tuple(service for service in self.services if getattr(service, field))

    def changed(self, purpose: str, changed_files: Sequence[str]) -> tuple[Service, ...]:
        candidates = self.selected(purpose)
        global_paths = self.global_change_paths.get(purpose)
        if global_paths is None:
            raise CatalogError(f"global change paths are not configured for purpose: {purpose}")
        if any(_path_matches(path, global_paths) for path in changed_files):
            if purpose in {"pytest", "audit"}:
                return tuple(service for service in candidates if service.kind == "python")
            return candidates
        return tuple(
            service
            for service in candidates
            if any(_path_matches(path, service.change_paths) for path in changed_files)
        )


def _require_mapping(name: str, value: Any) -> bool:
    if not isinstance(name, str) or not name:
        raise CatalogError("service names must be non-empty strings")
    if not isinstance(value, dict):
        raise CatalogError(f"service {name!r} must be an object")
    return True


def _string_tuple(owner: str, field: str, raw: Any) -> tuple[str, ...]:
    if not isinstance(raw, list) or any(not isinstance(item, str) or not item for item in raw):
        raise CatalogError(f"{owner!r} field {field!r} must be a list of non-empty strings")
    if len(raw) != len(set(raw)):
        raise CatalogError(f"{owner!r} field {field!r} contains duplicates")
    return tuple(raw)


def _purpose_paths(raw: Any) -> dict[str, tuple[str, ...]]:
    if not isinstance(raw, dict):
        raise CatalogError("global_change_paths must be an object keyed by purpose")
    if set(raw) != set(PURPOSES):
        raise CatalogError(f"global_change_paths keys must be exactly: {', '.join(PURPOSES)}")
    return {
        purpose: _string_tuple("global_change_paths", purpose, raw[purpose])
        for purpose in PURPOSES
    }


def _path_matches(path: str, configured_paths: Iterable[str]) -> bool:
    for configured in configured_paths:
        if configured.endswith("/"):
            if path.startswith(configured):
                return True
        elif path == configured:
            return True
    return False


def _configured_path_exists(repo_root: Path, configured: str) -> bool:
    candidate = repo_root / configured.rstrip("/")
    return candidate.is_dir() if configured.endswith("/") else candidate.exists()


def _executable(name: str) -> str:
    executable = shutil.which(name)
    if executable is None:
        raise CatalogError(f"required executable is not available: {name}")
    return executable


def _git_changed_files(repo_root: Path, base: str, head: str) -> list[str] | None:
    if not base or base == "0" * 40:
        return None
    git = _executable("git")
    verify = subprocess.run(  # noqa: S603 - executable resolved from trusted PATH
        [git, "cat-file", "-e", f"{base}^{{commit}}"],
        cwd=repo_root,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if verify.returncode != 0:
        return None
    result = subprocess.run(  # noqa: S603 - fixed git arguments, SHAs are separate argv items
        [git, "diff", "--name-only", "--diff-filter=ACMRT", base, head],
        cwd=repo_root,
        text=True,
        capture_output=True,
        check=True,
    )
    return [line for line in result.stdout.splitlines() if line]


def _discover_python_services(repo_root: Path) -> set[str]:
    services_root = repo_root / "services"
    if not services_root.is_dir():
        raise CatalogError(f"services directory does not exist: {services_root}")
    return {
        path.parent.name
        for path in services_root.glob("*/pyproject.toml")
        if path.is_file()
    }


def _discover_migration_services(repo_root: Path) -> set[str]:
    services_root = repo_root / "services"
    return {
        path.parent.name
        for path in services_root.glob("*/alembic.ini")
        if path.is_file()
    }


def _compose_model(repo_root: Path, compose_file: Path) -> Mapping[str, Any]:
    docker = _executable("docker")
    result = subprocess.run(  # noqa: S603 - executable resolved from trusted PATH
        [docker, "compose", "-f", str(compose_file), "config", "--format", "json"],
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


def _command_text(config: Mapping[str, Any]) -> str:
    command = config.get("command")
    if isinstance(command, str):
        return command
    if isinstance(command, list) and all(isinstance(item, str) for item in command):
        return " ".join(command)
    return ""


def validate_repository(catalog: Catalog, repo_root: Path, compose_file: Path) -> None:
    errors: list[str] = []
    names = [service.name for service in catalog.services]
    if len(names) != len(set(names)):
        errors.append("catalog contains duplicate service names")

    for purpose, configured_paths in catalog.global_change_paths.items():
        for configured in configured_paths:
            if not _configured_path_exists(repo_root, configured):
                errors.append(f"global {purpose} change path does not exist: {configured}")

    python_catalog = {service.name for service in catalog.services if service.kind == "python"}
    discovered_python = _discover_python_services(repo_root)
    missing_python = sorted(discovered_python - python_catalog)
    stale_python = sorted(python_catalog - discovered_python)
    if missing_python:
        errors.append(f"Python services missing from catalog: {', '.join(missing_python)}")
    if stale_python:
        errors.append(f"Catalog Python services missing from repository: {', '.join(stale_python)}")

    migration_catalog = {
        service.name for service in catalog.services if service.migration is not None
    }
    discovered_migrations = _discover_migration_services(repo_root)
    missing_migrations = sorted(discovered_migrations - migration_catalog)
    stale_migrations = sorted(migration_catalog - discovered_migrations)
    if missing_migrations:
        errors.append(
            f"Migration services missing migration metadata: {', '.join(missing_migrations)}"
        )
    if stale_migrations:
        errors.append(
            f"Catalog migration services missing alembic.ini: {', '.join(stale_migrations)}"
        )

    build_targets: list[str] = []
    migration_targets: list[str] = []
    for service in catalog.services:
        path = repo_root / service.path
        dockerfile = repo_root / service.dockerfile
        if not path.is_dir():
            errors.append(f"{service.name}: path does not exist: {service.path}")
        if not dockerfile.is_file():
            errors.append(f"{service.name}: Dockerfile does not exist: {service.dockerfile}")
        if service.kind == "python" and not (path / "pyproject.toml").is_file():
            errors.append(f"{service.name}: Python service has no pyproject.toml")
        if service.kind == "frontend" and not (path / "package.json").is_file():
            errors.append(f"{service.name}: frontend service has no package.json")
        for configured in service.change_paths:
            if not _configured_path_exists(repo_root, configured):
                errors.append(f"{service.name}: change path does not exist: {configured}")
        build_targets.extend(service.compose_build)

        declared_migrate_targets = [
            target for target in service.compose_build if target.endswith("-migrate")
        ]
        if service.migration is None:
            if declared_migrate_targets:
                errors.append(
                    f"{service.name}: compose migration target exists without migration metadata: "
                    f"{', '.join(declared_migrate_targets)}"
                )
            continue

        migration = service.migration
        migration_targets.append(migration.compose_target)
        if migration.compose_target not in service.compose_build:
            errors.append(
                f"{service.name}: migration compose target {migration.compose_target!r} "
                "is not present in compose_build"
            )
        if declared_migrate_targets != [migration.compose_target]:
            errors.append(
                f"{service.name}: expected exactly migration target {migration.compose_target!r}, "
                f"found {declared_migrate_targets}"
            )

        alembic_ini = path / "alembic.ini"
        env_py = path / "alembic" / "env.py"
        versions_dir = path / "alembic" / "versions"
        if not alembic_ini.is_file():
            errors.append(f"{service.name}: alembic.ini does not exist")
        if not env_py.is_file():
            errors.append(f"{service.name}: alembic/env.py does not exist")
        if not versions_dir.is_dir():
            errors.append(f"{service.name}: alembic/versions does not exist")
        elif not any(
            migration_file.is_file() and migration_file.name != "__init__.py"
            for migration_file in versions_dir.glob("*.py")
        ):
            errors.append(f"{service.name}: alembic/versions contains no revisions")

    duplicate_targets = sorted({name for name in build_targets if build_targets.count(name) > 1})
    if duplicate_targets:
        errors.append(f"Compose build targets assigned more than once: {', '.join(duplicate_targets)}")
    duplicate_migration_targets = sorted(
        {name for name in migration_targets if migration_targets.count(name) > 1}
    )
    if duplicate_migration_targets:
        errors.append(
            "Migration compose targets assigned more than once: "
            + ", ".join(duplicate_migration_targets)
        )

    model = _compose_model(repo_root, compose_file)
    compose_services = model.get("services")
    if not isinstance(compose_services, dict):
        errors.append("Compose model does not contain a services object")
        compose_services = {}

    configured_targets = set(build_targets)
    missing_targets = sorted(configured_targets - compose_services.keys())
    if missing_targets:
        errors.append(f"Catalog compose targets missing from Compose: {', '.join(missing_targets)}")
    buildable = {
        name
        for name, config in compose_services.items()
        if isinstance(config, dict) and "build" in config
    }
    uncatalogued = sorted(buildable - configured_targets)
    if uncatalogued:
        errors.append(f"Buildable Compose services missing from catalog: {', '.join(uncatalogued)}")

    for service in catalog.selected("migration"):
        assert service.migration is not None
        target = service.migration.compose_target
        config = compose_services.get(target)
        if not isinstance(config, dict):
            continue
        command = _command_text(config)
        if "alembic" not in command or "upgrade" not in command:
            errors.append(
                f"{service.name}: Compose migration target {target!r} must run alembic upgrade"
            )
        environment = config.get("environment")
        if not isinstance(environment, dict) or service.migration.database_url_env not in environment:
            errors.append(
                f"{service.name}: Compose migration target {target!r} does not expose "
                f"{service.migration.database_url_env}"
            )

    if errors:
        raise CatalogError("service catalog validation failed:\n- " + "\n- ".join(errors))


def _service_matrix(services: Sequence[Service], purpose: str) -> str:
    if purpose in {"pytest", "audit"}:
        return json.dumps([service.name for service in services], separators=(",", ":"))
    if purpose == "docker":
        return json.dumps(
            {
                "include": [
                    {
                        "service": service.name,
                        "dockerfile": service.dockerfile,
                        "image": f"parsevk-{service.name}:scan",
                    }
                    for service in services
                ]
            },
            separators=(",", ":"),
        )
    if purpose == "migration":
        return json.dumps(
            {
                "include": [
                    {
                        "service": service.name,
                        "database_url_env": service.migration.database_url_env,
                    }
                    for service in services
                    if service.migration is not None
                ]
            },
            separators=(",", ":"),
        )
    raise CatalogError(f"matrix is not supported for purpose: {purpose}")


def _deploy_targets(services: Sequence[Service]) -> list[str]:
    result: list[str] = []
    for service in services:
        for target in service.compose_build:
            if target not in result:
                result.append(target)
    return result


def _resolve_services(args: argparse.Namespace, catalog: Catalog) -> tuple[Service, ...]:
    if args.all:
        return catalog.selected(args.purpose)
    if args.changed_file:
        return catalog.changed(args.purpose, args.changed_file)
    if not args.base or not args.head:
        raise CatalogError("provide --all, --changed-file, or both --base and --head")
    changed_files = _git_changed_files(args.repo_root, args.base, args.head)
    if changed_files is None:
        return catalog.selected(args.purpose)
    return catalog.changed(args.purpose, changed_files)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=CATALOG_PATH)
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser("validate", help="validate catalog and repository coverage")
    validate.add_argument("--compose-file", type=Path, default=Path("docker-compose.yml"))

    for command in ("matrix", "changed"):
        child = subparsers.add_parser(command)
        child.add_argument("--purpose", required=True, choices=PURPOSES)
        child.add_argument("--all", action="store_true")
        child.add_argument("--base")
        child.add_argument("--head")
        child.add_argument("--changed-file", action="append", default=[])
        child.add_argument("--github-output", type=Path)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.repo_root = args.repo_root.resolve()
    catalog_path = args.catalog
    if not catalog_path.is_absolute():
        catalog_path = args.repo_root / catalog_path

    try:
        catalog = Catalog.load(catalog_path)
        if args.command == "validate":
            compose_file = args.compose_file
            if not compose_file.is_absolute():
                compose_file = args.repo_root / compose_file
            validate_repository(catalog, args.repo_root, compose_file)
            migration_count = len(catalog.selected("migration"))
            print(
                f"Service catalog is valid: {len(catalog.services)} services, "
                f"{migration_count} migration services"
            )
            return 0

        services = _resolve_services(args, catalog)
        if args.command == "matrix":
            if args.purpose == "deploy":
                raise CatalogError("use changed --purpose deploy for Compose targets")
            value = _service_matrix(services, args.purpose)
        else:
            if args.purpose == "deploy":
                value = " ".join(_deploy_targets(services))
            else:
                value = " ".join(service.name for service in services)

        if args.github_output:
            args.github_output.parent.mkdir(parents=True, exist_ok=True)
            with args.github_output.open("a", encoding="utf-8") as output:
                output.write(f"value={value}\n")
                output.write(f"changed={'true' if services else 'false'}\n")
        print(value)
        return 0
    except (CatalogError, subprocess.CalledProcessError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
