#!/usr/bin/env python3
"""Read, validate and query the parseVK service catalog."""

from __future__ import annotations

import argparse
import subprocess
import sys
from collections.abc import Sequence
from pathlib import Path

from service_catalog_lib import (
    CATALOG_PATH,
    PURPOSES,
    Catalog,
    CatalogError,
    Service,
    deploy_targets,
    git_changed_files,
    service_matrix,
    validate_repository,
)


def resolve_services(
    args: argparse.Namespace, catalog: Catalog
) -> tuple[Service, ...]:
    if args.all:
        return catalog.selected(args.purpose)
    if args.changed_file:
        return catalog.changed(args.purpose, args.changed_file)
    if not args.base or not args.head:
        raise CatalogError("provide --all, --changed-file, or both --base and --head")
    changed_files = git_changed_files(args.repo_root, args.base, args.head)
    if changed_files is None:
        return catalog.selected(args.purpose)
    return catalog.changed(args.purpose, changed_files)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=CATALOG_PATH)
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser(
        "validate", help="validate catalog and repository coverage"
    )
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
    args = build_parser().parse_args(argv)
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
            print(
                f"Service catalog is valid: {len(catalog.services)} services, "
                f"{len(catalog.selected('migration'))} migration services"
            )
            return 0

        services = resolve_services(args, catalog)
        if args.command == "matrix":
            if args.purpose == "deploy":
                raise CatalogError(
                    "use changed --purpose deploy for Compose targets"
                )
            value = service_matrix(services, args.purpose)
        elif args.purpose == "deploy":
            value = " ".join(deploy_targets(services))
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
