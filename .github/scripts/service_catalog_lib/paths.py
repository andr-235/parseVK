from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path


def path_matches(path: str, configured_paths: Iterable[str]) -> bool:
    for configured in configured_paths:
        if configured.endswith("/"):
            if path.startswith(configured):
                return True
        elif path == configured:
            return True
    return False


def configured_path_exists(repo_root: Path, configured: str) -> bool:
    candidate = repo_root / configured.rstrip("/")
    return candidate.is_dir() if configured.endswith("/") else candidate.exists()
