from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest

from parsevk_contracts.generation.policy_evolution import compare_generated_contracts
from parsevk_contracts.generation.policy_layout import validate_unversioned_layout

CONTRACTS_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = CONTRACTS_ROOT.parents[2]
GIT = shutil.which("git")


def test_repository_uses_unversioned_contract_layout():
    assert validate_unversioned_layout(CONTRACTS_ROOT) == ()


def test_changed_contracts_are_backward_readable_from_ci_baseline(tmp_path: Path):
    baseline_sha = _github_baseline_sha()
    if baseline_sha is None:
        pytest.skip("No GitHub comparison baseline is available")
    if GIT is None:
        pytest.skip("git executable is unavailable")

    baseline_generated = tmp_path / "generated"
    paths = _git_lines(
        "ls-tree",
        "-r",
        "--name-only",
        baseline_sha,
        "libs/py/contracts/generated",
    )
    if not paths:
        pytest.skip("Baseline predates generated contract artifacts")

    for repository_path in paths:
        relative = Path(repository_path).relative_to("libs/py/contracts/generated")
        target = baseline_generated / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(
            subprocess.check_output(  # noqa: S603 - fixed executable and git-owned path
                [GIT, "show", f"{baseline_sha}:{repository_path}"],
                cwd=REPOSITORY_ROOT,
            )
        )

    assert compare_generated_contracts(
        baseline_generated,
        CONTRACTS_ROOT / "generated",
    ) == ()


def _github_baseline_sha() -> str | None:
    event_path = os.environ.get("GITHUB_EVENT_PATH")
    if not event_path:
        return None
    event = json.loads(Path(event_path).read_text(encoding="utf-8"))
    candidates = (
        event.get("pull_request", {}).get("base", {}).get("sha"),
        event.get("before"),
        event.get("inputs", {}).get("base_sha"),
    )
    for candidate in candidates:
        if candidate and candidate != "0" * 40:
            return str(candidate)
    return None


def _git_lines(*args: str) -> list[str]:
    if GIT is None:
        raise RuntimeError("git executable is unavailable")
    output = subprocess.check_output(  # noqa: S603 - fixed executable and static args
        [GIT, *args],
        cwd=REPOSITORY_ROOT,
        text=True,
    )
    return [line for line in output.splitlines() if line]
