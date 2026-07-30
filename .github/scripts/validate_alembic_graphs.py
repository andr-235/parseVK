#!/usr/bin/env python3
"""Validate Alembic revision graphs declared by the service catalog."""

from __future__ import annotations

import argparse
from collections.abc import Iterable, Sequence
from pathlib import Path

from alembic_graph import validate_versions_dir
from service_catalog_lib import CATALOG_PATH, Catalog, CatalogError, Service

ROOT = Path(__file__).resolve().parents[2]


def select_services(catalog: Catalog, requested: Iterable[str]) -> tuple[Service, ...]:
    services = {service.name: service for service in catalog.selected("migration")}
    names = tuple(requested)
    if not names:
        return tuple(services.values())
    unknown = sorted(set(names) - services.keys())
    if unknown:
        raise CatalogError(
            "requested services are not migration services: " + ", ".join(unknown)
        )
    return tuple(services[name] for name in names)


def validate_services(
    catalog: Catalog, repo_root: Path, requested: Iterable[str] = ()
) -> list[str]:
    errors: list[str] = []
    for service in select_services(catalog, requested):
        versions = repo_root / service.path / "alembic" / "versions"
        service_errors, head = validate_versions_dir(service.name, versions)
        errors.extend(service_errors)
        if not service_errors and head is not None:
            print(f"{service.name}: {head} (head)")
    return errors


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=ROOT)
    parser.add_argument("--catalog", type=Path, default=CATALOG_PATH)
    parser.add_argument("--service", action="append", default=[])
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    repo_root = args.repo_root.resolve()
    catalog_path = args.catalog
    if not catalog_path.is_absolute():
        catalog_path = repo_root / catalog_path
    try:
        catalog = Catalog.load(catalog_path)
        errors = validate_services(catalog, repo_root, args.service)
    except CatalogError as exc:
        print(f"Alembic graph validation failed:\n- {exc}")
        return 1
    if errors:
        print("\nAlembic graph validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
