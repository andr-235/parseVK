from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

MAX_COMMITS_PER_RUN = 50
ZERO_SHA = "0" * 40


def _git(args: list[str], cwd: Path, *, check: bool = True) -> str:
    completed = subprocess.run(  # noqa: S603 -- fixed git executable, internal args
        ["/usr/bin/git", *args],
        cwd=cwd,
        check=check,
        text=True,
        capture_output=True,
    )
    return completed.stdout.strip()


def _is_ancestor(base: str, head: str, cwd: Path) -> bool:
    completed = subprocess.run(  # noqa: S603 -- fixed git executable and command
        ["/usr/bin/git", "merge-base", "--is-ancestor", base, head],
        cwd=cwd,
        check=False,
        text=True,
        capture_output=True,
    )
    return completed.returncode == 0


def _merge_base(base: str, head: str, cwd: Path) -> str:
    return _git(["merge-base", base, head], cwd)


def _start_sha(action: str, base: str, before: str, head: str, cwd: Path) -> str:
    if (
        action == "synchronize"
        and before
        and before != ZERO_SHA
        and _is_ancestor(before, head, cwd)
    ):
        return before
    return _merge_base(base, head, cwd)


def build_plan(
    *,
    action: str,
    base_sha: str,
    before_sha: str,
    head_sha: str,
    cwd: Path,
) -> dict[str, Any]:
    start_sha = _start_sha(action, base_sha, before_sha, head_sha, cwd)
    output = _git(
        ["rev-list", "--reverse", "--topo-order", f"{start_sha}..{head_sha}"],
        cwd,
    )
    commits = [line for line in output.splitlines() if line]
    if len(commits) > MAX_COMMITS_PER_RUN:
        return {
            "schema_version": 1,
            "run_head_sha": head_sha,
            "start_sha": start_sha,
            "status": "oversized",
            "reason": "too-many-commits",
            "units": [],
            "commit_count": len(commits),
        }

    units = []
    for index, commit_sha in enumerate(commits, start=1):
        parent_sha = _git(["rev-parse", f"{commit_sha}^1"], cwd)
        units.append(
            {
                "index": f"{index:03d}",
                "base_sha": parent_sha,
                "head_sha": commit_sha,
            }
        )
    return {
        "schema_version": 1,
        "run_head_sha": head_sha,
        "start_sha": start_sha,
        "status": "review" if units else "empty",
        "reason": "commit-review-required" if units else "no-new-commits",
        "units": units,
        "commit_count": len(units),
    }


def write_plan(path: Path, plan: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(plan, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def matrix_json(plan: dict[str, Any]) -> str:
    return json.dumps(plan.get("units", []), separators=(",", ":"))
