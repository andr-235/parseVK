#!/usr/bin/env python3
"""Reject GitHub contexts that are unavailable in workflow and job env blocks."""

from __future__ import annotations

import re
import sys
from pathlib import Path

KEY_RE = re.compile(r"^(?P<indent> *)(?P<key>[A-Za-z0-9_.-]+):")
EXPRESSION_RE = re.compile(r"\$\{\{(.*?)\}\}")
CONTEXT_RE = re.compile(r"\b([A-Za-z_][A-Za-z0-9_-]*)\.")

WORKFLOW_ENV_CONTEXTS = frozenset({"github", "secrets", "inputs", "vars"})
JOB_ENV_CONTEXTS = frozenset(
    {"github", "needs", "strategy", "matrix", "vars", "secrets", "inputs"}
)


def contexts_in(line: str) -> set[str]:
    contexts: set[str] = set()
    for expression in EXPRESSION_RE.findall(line):
        contexts.update(CONTEXT_RE.findall(expression))
    return contexts


def allowed_contexts(path: list[str]) -> frozenset[str] | None:
    parent = path[:-1]
    if parent == ["env"]:
        return WORKFLOW_ENV_CONTEXTS
    if len(parent) == 3 and parent[0] == "jobs" and parent[2] == "env":
        return JOB_ENV_CONTEXTS
    return None


def validate(path: Path) -> list[str]:
    stack: list[tuple[int, str]] = []
    errors: list[str] = []

    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        match = KEY_RE.match(line)
        if match is None:
            continue

        indent = len(match.group("indent"))
        key = match.group("key")
        while stack and stack[-1][0] >= indent:
            stack.pop()
        stack.append((indent, key))

        key_path = [item[1] for item in stack]
        allowed = allowed_contexts(key_path)
        if allowed is None:
            continue

        forbidden = contexts_in(line) - allowed
        if forbidden:
            rendered = ", ".join(sorted(forbidden))
            errors.append(
                f"{path}:{line_number}: contexts unavailable in "
                f"{'.'.join(key_path[:-1])}: {rendered}"
            )

    return errors


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    workflows = sorted((root / ".github/workflows").glob("*.y*ml"))
    errors = [error for workflow in workflows for error in validate(workflow)]

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    print(f"Validated context availability in {len(workflows)} workflow files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
