from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from .errors import CatalogError


def executable(name: str) -> str:
    resolved = shutil.which(name)
    if resolved is None:
        raise CatalogError(f"required executable is not available: {name}")
    return resolved


def git_changed_files(repo_root: Path, base: str, head: str) -> list[str] | None:
    if not base or base == "0" * 40:
        return None
    git = executable("git")
    verify = subprocess.run(  # noqa: S603 - executable resolved from trusted PATH
        [git, "cat-file", "-e", f"{base}^{{commit}}"],
        cwd=repo_root,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if verify.returncode != 0:
        return None
    result = subprocess.run(  # noqa: S603 - fixed git argv
        [git, "diff", "--name-only", "--diff-filter=ACMRT", f"{base}...{head}"],
        cwd=repo_root,
        text=True,
        capture_output=True,
        check=True,
    )
    return [line for line in result.stdout.splitlines() if line]
