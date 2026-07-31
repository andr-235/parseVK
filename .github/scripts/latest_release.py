#!/usr/bin/env python3
"""Resolve the newest semantic-release commit reachable from a Git ref."""

from __future__ import annotations

import argparse
import json
import subprocess
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

RELEASE_PREFIX = "chore(release):"
RELEASE_MARKER = "[skip ci]"


class ReleaseResolutionError(RuntimeError):
    """No valid semantic-release commit can be resolved safely."""


@dataclass(frozen=True)
class ReleaseCommit:
    sha: str
    source_sha: str
    subject: str

    def to_dict(self) -> dict[str, str]:
        return {
            "release_sha": self.sha,
            "source_sha": self.source_sha,
            "subject": self.subject,
        }


def run_git(args: Sequence[str], *, cwd: Path) -> str:
    completed = subprocess.run(  # noqa: S603 -- fixed executable and internal arguments
        ["/usr/bin/git", *args],
        cwd=cwd,
        check=False,
        text=True,
        capture_output=True,
    )
    if completed.returncode:
        raise ReleaseResolutionError(completed.stderr.strip() or "git command failed")
    return completed.stdout


def latest_release(ref: str, *, cwd: Path) -> ReleaseCommit:
    rows = run_git(
        [
            "log",
            ref,
            "--format=%H%x09%P%x09%s",
            "--extended-regexp",
            r"--grep=^chore\(release\):",
        ],
        cwd=cwd,
    )
    for row in rows.splitlines():
        if not row.strip():
            continue
        sha, parents, subject = row.split("\t", 2)
        parent = parents.split()[0] if parents.split() else ""
        message = run_git(["show", "-s", "--format=%B", sha], cwd=cwd)
        if subject.startswith(RELEASE_PREFIX) and RELEASE_MARKER in message and parent:
            return ReleaseCommit(sha=sha, source_sha=parent, subject=subject)
    raise ReleaseResolutionError(f"no semantic-release commit reachable from {ref}")


def write_github_output(path: Path, release: ReleaseCommit) -> None:
    with path.open("a", encoding="utf-8") as output:
        output.write(f"release_sha={release.sha}\n")
        output.write(f"source_sha={release.source_sha}\n")
        output.write(f"subject={release.subject}\n")


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--ref", default="main")
    root.add_argument("--repo", type=Path, default=Path.cwd())
    root.add_argument("--github-output", type=Path)
    return root


def main(argv: Sequence[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        release = latest_release(args.ref, cwd=args.repo)
    except ReleaseResolutionError as error:
        print(f"latest-release error: {error}")
        return 2
    if args.github_output is not None:
        write_github_output(args.github_output, release)
    print(json.dumps(release.to_dict(), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
