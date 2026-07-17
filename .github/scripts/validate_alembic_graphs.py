#!/usr/bin/env python3
"""Validate Alembic revision graphs without importing service dependencies."""

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAX_REVISION_LENGTH = 32


def _metadata(path: Path) -> tuple[str, tuple[str, ...]]:
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
    if not isinstance(revision, str):
        raise ValueError("revision must be a string literal")
    if down_revision is None:
        parents: tuple[str, ...] = ()
    elif isinstance(down_revision, str):
        parents = (down_revision,)
    elif isinstance(down_revision, (tuple, list)) and all(
        isinstance(parent, str) for parent in down_revision
    ):
        parents = tuple(down_revision)
    else:
        raise ValueError("down_revision must be None, a string, or a string sequence")

    return revision, parents


def main() -> int:
    errors: list[str] = []

    for versions_dir in sorted(ROOT.glob("services/*/alembic/versions")):
        service = versions_dir.parents[1].name
        revisions: dict[str, Path] = {}
        referenced: set[str] = set()

        for path in sorted(versions_dir.glob("*.py")):
            if path.name == "__init__.py":
                continue
            try:
                revision, parents = _metadata(path)
            except (SyntaxError, ValueError) as exc:
                errors.append(f"{service}: {path.name}: {exc}")
                continue

            if len(revision) > MAX_REVISION_LENGTH:
                errors.append(
                    f"{service}: revision {revision!r} is {len(revision)} characters; "
                    f"maximum is {MAX_REVISION_LENGTH}"
                )
            if revision in revisions:
                errors.append(
                    f"{service}: duplicate revision {revision!r} in "
                    f"{revisions[revision].name} and {path.name}"
                )
            revisions[revision] = path
            referenced.update(parents)

        missing = sorted(referenced - revisions.keys())
        if missing:
            errors.append(f"{service}: missing parent revisions: {', '.join(missing)}")

        heads = sorted(revisions.keys() - referenced)
        if len(heads) != 1:
            errors.append(f"{service}: expected exactly one head, found {heads}")
        elif revisions:
            print(f"{service}: {heads[0]} (head)")

    if errors:
        print("\nAlembic graph validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
