#!/usr/bin/env python3
"""Run the core reviewer command and merge mandatory AGENTS.md findings."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

MERGED_COMMANDS = {"finalize", "fallback"}


def option_value(arguments: list[str], name: str) -> str | None:
    try:
        index = arguments.index(name)
    except ValueError:
        return None
    return arguments[index + 1] if index + 1 < len(arguments) else None


def main() -> int:
    arguments = sys.argv[1:]
    directory = Path(__file__).resolve().parent
    core = directory / "ai_review_core.py"
    merger = directory / "ai_review_agents_merge.py"
    completed = subprocess.run(  # noqa: S603 -- immutable trusted scripts
        [sys.executable, str(core), *arguments],
        check=False,
    )
    if completed.returncode or not arguments or arguments[0] not in MERGED_COMMANDS:
        return completed.returncode
    output = option_value(arguments, "--output")
    if output is None:
        return completed.returncode
    result_path = Path(output)
    merged = subprocess.run(  # noqa: S603 -- immutable trusted merger
        [
            sys.executable,
            str(merger),
            "--result",
            str(result_path),
            "--findings",
            str(result_path.parent / "agents-findings.json"),
        ],
        check=False,
    )
    return merged.returncode


if __name__ == "__main__":
    raise SystemExit(main())
