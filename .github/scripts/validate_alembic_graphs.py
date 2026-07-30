#!/usr/bin/env python3
"""Validate Alembic revision graphs declared by the service catalog."""

from __future__ import annotations

import argparse
import ast
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path

from service_catalog import CATALOG_PATH, Catalog, CatalogError, Service

ROOT = Path(__file__).resolve().parents[2]
MAX_REVISION_LENGTH = 32


@dataclass(frozen=True)
class Revision:
    revision: str
    parents: tuple[str, ...]
    path: Path


def _metadata(path: Path) -> Revision:
    values: dict[str, object] = {}
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))

    for node in tree.body:
        name: str | None = None
        if isinstance(node, ast.Assign) and len(node.targets) == 1:
            target = node.targets[0]
            if isinstance(target, ast.Name):
                name = target.id
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            name = node.target.id

        if name in {"revision", "down_revision"} and node.value is not None:
            values[name] = ast.literal_eval(node.value)

    revision = values.get("revision")
    down_revision = values.get("down_revision")
    if not isinstance(revision, str) or not revision:
        raise ValueError("revision must be a non-empty string literal")
    if down_revision is None:
        parents: tuple[str, ...] = ()
    elif isinstance(down_revision, str):
        parents = (down_revision,)
    elif isinstance(down_revision, (tuple, list)) and all(
        isinstance(parent, str) and parent for parent in down_revision
    ):
        parents = tuple(down_revision)
    else:
        raise ValueError("down_revision must be None, a string, or a non-empty string sequence")

    if len(parents) != len(set(parents)):
        raise ValueError("down_revision contains duplicate parents")
    if revision in parents:
        raise ValueError("revision cannot depend on itself")
    return Revision(revision=revision, parents=parents, path=path)


def _find_cycle(revisions: dict[str, Revision]) -> tuple[str, ...] | None:
    state: dict[str, int] = {}
    stack: list[str] = []

    def visit(revision: str) -> tuple[str, ...] | None:
        marker = state.get(revision, 0)
        if marker == 2:
            return None
        if marker == 1:
            start = stack.index(revision)
            return tuple(stack[start:] + [revision])

        state[revision] = 1
        stack.append(revision)
        for parent in revisions[revision].parents:
            if parent in revisions:
                cycle = visit(parent)
                if cycle is not None:
                    return cycle
        stack.pop()
        state[revision] = 2
        return None

    for revision in revisions:
        cycle = visit(revision)
        if cycle is not None:
            return cycle
    return None


def _ancestors_of(head: str, revisions: dict[str, Revision]) -> set[str]:
    ancestors: set[str] = set()
    pending = [head]
    while pending:
        current = pending.pop()
        if current in ancestors:
            continue
        ancestors.add(current)
        pending.extend(parent for parent in revisions[current].parents if parent in revisions)
    return ancestors


def validate_versions_dir(service: str, versions_dir: Path) -> tuple[list[str], str | None]:
    errors: list[str] = []
    revisions: dict[str, Revision] = {}
    referenced: set[str] = set()

    migration_files = [
        path
        for path in sorted(versions_dir.glob("*.py"))
        if path.name != "__init__.py" and path.is_file()
    ]
    if not migration_files:
        return [f"{service}: no migration revisions found"], None

    for path in migration_files:
        try:
            metadata = _metadata(path)
        except (SyntaxError, ValueError) as exc:
            errors.append(f"{service}: {path.name}: {exc}")
            continue

        if len(metadata.revision) > MAX_REVISION_LENGTH:
            errors.append(
                f"{service}: revision {metadata.revision!r} is "
                f"{len(metadata.revision)} characters; maximum is {MAX_REVISION_LENGTH}"
            )
        previous = revisions.get(metadata.revision)
        if previous is not None:
            errors.append(
                f"{service}: duplicate revision {metadata.revision!r} in "
                f"{previous.path.name} and {path.name}"
            )
        revisions[metadata.revision] = metadata
        referenced.update(metadata.parents)

    if not revisions:
        return errors, None

    missing = sorted(referenced - revisions.keys())
    if missing:
        errors.append(f"{service}: missing parent revisions: {', '.join(missing)}")

    bases = sorted(revision.revision for revision in revisions.values() if not revision.parents)
    if not bases:
        errors.append(f"{service}: expected at least one base revision")

    heads = sorted(revisions.keys() - referenced)
    if len(heads) != 1:
        errors.append(f"{service}: expected exactly one head, found {heads}")

    cycle = _find_cycle(revisions)
    if cycle is not None:
        errors.append(f"{service}: revision cycle detected: {' -> '.join(cycle)}")

    if len(heads) == 1 and cycle is None and not missing:
        connected = _ancestors_of(heads[0], revisions)
        disconnected = sorted(revisions.keys() - connected)
        if disconnected:
            errors.append(
                f"{service}: revisions do not converge into head {heads[0]!r}: "
                f"{', '.join(disconnected)}"
            )

    return errors, heads[0] if len(heads) == 1 else None


def _select_services(catalog: Catalog, requested: Iterable[str]) -> tuple[Service, ...]:
    migration_services = {service.name: service for service in catalog.selected("migration")}
    requested_names = tuple(requested)
    if not requested_names:
        return tuple(migration_services.values())

    unknown = sorted(set(requested_names) - migration_services.keys())
    if unknown:
        raise CatalogError("requested services are not migration services: " + ", ".join(unknown))
    return tuple(migration_services[name] for name in requested_names)


def validate_services(
    catalog: Catalog,
    repo_root: Path,
    requested: Iterable[str] = (),
) -> list[str]:
    errors: list[str] = []
    for service in _select_services(catalog, requested):
        versions_dir = repo_root / service.path / "alembic" / "versions"
        service_errors, head = validate_versions_dir(service.name, versions_dir)
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
