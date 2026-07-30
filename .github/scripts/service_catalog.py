#!/usr/bin/env python3
"""Read and validate the parseVK service catalog without third-party packages.

The catalog is stored as JSON-compatible YAML 1.2. JSON is a strict subset of
YAML, so the file remains valid YAML while the CLI can use Python's standard
library on GitHub-hosted and self-hosted runners.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

CATALOG_PATH = Path(".github/service-catalog.yaml")
PURPOSE_FIELDS = {
    "pytest": "pytest",
    "audit": "dependency_audit",
    "docker": "docker_scan",
}


class CatalogError(RuntimeError):
    """Raised when the service catalog or repository contract is invalid."""


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

    @classmethod
    def from_mapping(cls, name: str, value: Mapping[str, Any]) -> "Service":
        required = {
            "kind",
            "path",
            "dockerfile",
            "change_paths",
            "pytest",
            "dependency_audit",
            "docker_scan",
            "compose_build",
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

        return cls(
            name=name,
            kind=kind,
            path=value["path"],
            dockerfile=value["dockerfile"],
            change_paths=change_paths,
            compose_build=compose_build,
            **booleans,
        )


@dataclass(frozen=True)
class Catalog:
    schema_version: int
    global_change_paths: tuple[str, ...]
    services: tuple[Service, ...]

    @classmethod
    def load(cls, path: Path) -> "Catalog":
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
        if raw["schema_version"] != 1:
            raise CatalogError(f"unsupported catalog schema version: {raw['schema_version']!r}")

        global_paths = _string_tuple("catalog", "global_change_paths", raw["global_change_paths"])
        services_raw = raw["services"]
        if not isinstance(services_raw, dict) or not services_raw:
            raise CatalogError("catalog services must be a non-empty object")

        services = tuple(
            Service.from_mapping(name, value)
            for name, value in sorted(services_raw.items())
            if _require_mapping(name, value)
        )
        return cls(1, global_paths, services)

    def selected(self, purpose: str) -> tuple[Service, ...]:
        if purpose == "deploy":
            return self.services
        field = PURPOSE_FIELDS.get(purpose)
        if field is None:
            raise CatalogError(f"unsupported purpose: {purpose}")
        return tuple(service for service in self.services if getattr(service, field))

    def changed(self, purpose: str, changed_files: Sequence[str]) -> tuple[Service, ...]:
        candidates = self.selected(purpose)
        if any(_path_matches(path, self.global_change_paths) for path in changed_files):
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


def _path_matches(path: str, prefixes: Iterable[str]) -> bool:
    return any(path == prefix.rstrip("/") or path.startswith(prefix) for prefix in prefixes)


def _git_changed_files(repo_root: Path, base: str, head: str) -> list[str] | None:
    if not base or base == "0" * 40:
        return None
    verify = subprocess.run(
        ["git", "cat-file", "-e", f"{base}^{{commit}}"],
        cwd=repo_root,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if verify.returncode != 0:
        return None
    result = subprocess.run(
        ["git", "diff", "--name-only", "--diff-filter=ACMRT", base, head],
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


def _compose_model(repo_root: Path, compose_file: Path) -> Mapping[str, Any]:
    result = subprocess.run(
        ["docker", "compose", "-f", str(compose_file), "config", "--format", "json"],
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


def validate_repository(catalog: Catalog, repo_root: Path, compose_file: Path) -> None:
    errors: list[str] = []
    names = [service.name for service in catalog.services]
    if len(names) != len(set(names)):
        errors.append("catalog contains duplicate service names")

    python_catalog = {service.name for service in catalog.services if service.kind == "python"}
    discovered = _discover_python_services(repo_root)
    missing = sorted(discovered - python_catalog)
    stale = sorted(python_catalog - discovered)
    if missing:
        errors.append(f"Python services missing from catalog: {', '.join(missing)}")
    if stale:
        errors.append(f"Catalog Python services missing from repository: {', '.join(stale)}")

    build_targets: list[str] = []
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
        build_targets.extend(service.compose_build)

    duplicate_targets = sorted({name for name in build_targets if build_targets.count(name) > 1})
    if duplicate_targets:
        errors.append(f"Compose build targets assigned more than once: {', '.join(duplicate_targets)}")

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
        # Missing/unreachable base is intentionally fail-safe: run/build everything.
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
        child.add_argument(
            "--purpose",
            required=True,
            choices=["pytest", "audit", "docker", "deploy"],
        )
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
            print(f"Service catalog is valid: {len(catalog.services)} services")
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
