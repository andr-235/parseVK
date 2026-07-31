#!/usr/bin/env python3
"""Install immutable wrapper and merger around the trusted reviewer core."""

from __future__ import annotations

import argparse
import re
import subprocess
from pathlib import Path

SHA_RE = re.compile(r"^[0-9a-fA-F]{40}$")
WRAPPER_PATH = ".github/scripts/ai_review_agents_wrapper.py"
MERGER_PATH = ".github/scripts/ai_review_agents_merge.py"


class InstallError(RuntimeError):
    pass


def read_at_ref(base_sha: str, path: str, repo: Path) -> str:
    completed = subprocess.run(  # noqa: S603 -- fixed git executable and trusted paths
        ["/usr/bin/git", "show", f"{base_sha}:{path}"],
        cwd=repo,
        check=False,
        text=True,
        capture_output=True,
    )
    if completed.returncode:
        raise InstallError(f"cannot read trusted {path}: {completed.stderr.strip()}")
    return completed.stdout


def install(base_sha: str, repo: Path, trusted_dir: Path) -> None:
    if not SHA_RE.fullmatch(base_sha):
        raise InstallError("base SHA must contain 40 hexadecimal characters")
    active = trusted_dir / "ai_review.py"
    core = trusted_dir / "ai_review_core.py"
    if not active.is_file():
        raise InstallError("trusted ai_review.py is missing")
    wrapper = read_at_ref(base_sha, WRAPPER_PATH, repo)
    merger = read_at_ref(base_sha, MERGER_PATH, repo)
    if not core.exists():
        active.replace(core)
    active.write_text(wrapper, encoding="utf-8")
    (trusted_dir / "ai_review_agents_merge.py").write_text(merger, encoding="utf-8")
    print("Trusted AGENTS.md result wrapper installed.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--trusted-dir", type=Path, required=True)
    args = parser.parse_args()
    install(args.base, args.repo, args.trusted_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
