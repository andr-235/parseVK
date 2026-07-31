#!/usr/bin/env python3
"""Install immutable wrappers around the trusted reviewer runtime."""

from __future__ import annotations

import argparse
import os
import re
import shlex
import subprocess
from pathlib import Path

SHA_RE = re.compile(r"^[0-9a-fA-F]{40}$")
WRAPPER_PATH = ".github/scripts/ai_review_agents_wrapper.py"
MERGER_PATH = ".github/scripts/ai_review_agents_merge.py"
OPENCODE_PATH = ".github/scripts/ai_review_opencode.py"


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


def install_bash_env(trusted_dir: Path) -> None:
    wrapper = trusted_dir / Path(OPENCODE_PATH).name
    bash_env = trusted_dir / "ai-review-bash-env.sh"
    lines = []
    previous = os.environ.get("BASH_ENV")
    if previous:
        quoted = shlex.quote(previous)
        lines.append(f"[[ ! -f {quoted} ]] || source {quoted}")
    lines.append(
        f"opencode() {{ command python3 {shlex.quote(str(wrapper))} \"$@\"; }}"
    )
    bash_env.write_text("\n".join(lines) + "\n", encoding="utf-8")
    github_env = os.environ.get("GITHUB_ENV")
    if github_env:
        with Path(github_env).open("a", encoding="utf-8") as output:
            output.write(f"BASH_ENV={bash_env}\n")


def install(base_sha: str, repo: Path, trusted_dir: Path) -> None:
    if not SHA_RE.fullmatch(base_sha):
        raise InstallError("base SHA must contain 40 hexadecimal characters")
    active = trusted_dir / "ai_review.py"
    core = trusted_dir / "ai_review_core.py"
    if not active.is_file():
        raise InstallError("trusted ai_review.py is missing")
    sources = {
        "ai_review.py": read_at_ref(base_sha, WRAPPER_PATH, repo),
        "ai_review_agents_merge.py": read_at_ref(base_sha, MERGER_PATH, repo),
        "ai_review_opencode.py": read_at_ref(base_sha, OPENCODE_PATH, repo),
    }
    if not core.exists():
        active.replace(core)
    for name, content in sources.items():
        (trusted_dir / name).write_text(content, encoding="utf-8")
    install_bash_env(trusted_dir)
    print("Trusted AGENTS.md and bounded OpenCode runtime installed.")


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
