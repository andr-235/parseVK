#!/usr/bin/env python3
"""Publish validated parseVK AI findings as a GitHub Pull Request review."""

from __future__ import annotations

import argparse
import os
import sys
from collections.abc import Sequence
from pathlib import Path

from ai_review_ui import load_result, publish_inline_review
from ai_review_ui.github_api import GitHubApi
from ai_review_ui.models import PublishError


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--pr", type=int, required=True)
    root.add_argument("--result", type=Path, required=True)
    return root


def main(argv: Sequence[str] | None = None) -> int:
    try:
        args = parser().parse_args(argv)
        repository = os.environ.get("GITHUB_REPOSITORY", "")
        token = os.environ.get("GITHUB_TOKEN", "") or os.environ.get("GH_TOKEN", "")
        api = GitHubApi(
            repository,
            token,
            os.environ.get("GITHUB_API_URL", "https://api.github.com"),
        )
        result = load_result(args.result)
        outcome = publish_inline_review(api, args.pr, result)
        print(f"AI inline publisher: {outcome}")
        return 0
    except PublishError as error:
        print(f"::warning::AI inline publisher skipped: {error}", file=sys.stderr)
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
