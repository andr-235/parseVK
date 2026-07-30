from __future__ import annotations

import ast
from dataclasses import dataclass
from pathlib import Path
MAX_REVISION_LENGTH = 32

@dataclass(frozen=True)
class Revision:
    revision: str
    parents: tuple[str, ...]
    path: Path


def read_revision(path: Path) -> Revision:
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
        raise ValueError(
            "down_revision must be None, a string, or a non-empty string sequence"
        )
    if len(parents) != len(set(parents)):
        raise ValueError("down_revision contains duplicate parents")
    if revision in parents:
        raise ValueError("revision cannot depend on itself")
    return Revision(revision, parents, path)


def find_cycle(revisions: dict[str, Revision]) -> tuple[str, ...] | None:
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


def ancestors_of(head: str, revisions: dict[str, Revision]) -> set[str]:
    ancestors: set[str] = set()
    pending = [head]
    while pending:
        current = pending.pop()
        if current in ancestors:
            continue
        ancestors.add(current)
        pending.extend(
            parent for parent in revisions[current].parents if parent in revisions
        )
    return ancestors


def validate_versions_dir(
    service: str, versions_dir: Path
) -> tuple[list[str], str | None]:
    errors: list[str] = []
    revisions: dict[str, Revision] = {}
    referenced: set[str] = set()
    files = [
        path
        for path in sorted(versions_dir.glob("*.py"))
        if path.name != "__init__.py" and path.is_file()
    ]
    if not files:
        return [f"{service}: no migration revisions found"], None

    for path in files:
        try:
            metadata = read_revision(path)
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
    if not any(not revision.parents for revision in revisions.values()):
        errors.append(f"{service}: expected at least one base revision")
    heads = sorted(revisions.keys() - referenced)
    if len(heads) != 1:
        errors.append(f"{service}: expected exactly one head, found {heads}")
    cycle = find_cycle(revisions)
    if cycle is not None:
        errors.append(f"{service}: revision cycle detected: {' -> '.join(cycle)}")
    if len(heads) == 1 and cycle is None and not missing:
        disconnected = sorted(revisions.keys() - ancestors_of(heads[0], revisions))
        if disconnected:
            errors.append(
                f"{service}: revisions do not converge into head {heads[0]!r}: "
                f"{', '.join(disconnected)}"
            )
    return errors, heads[0] if len(heads) == 1 else None
