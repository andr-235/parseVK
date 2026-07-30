#!/usr/bin/env python3
"""Publish the final validated parseVK AI review result."""

from __future__ import annotations

import argparse
import os
import sys
from collections.abc import Sequence
from pathlib import Path

from ai_review_ui import load_result, publish_review_result
from ai_review_ui.github_api import GitHubApi
from ai_review_ui.models import PublishError, SkipPublication


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--pr", type=int, required=True)
    root.add_argument("--result", type=Path, required=True)
    return root


def main(argv: Sequence[str] | None = None) -> int:
    api: GitHubApi | None = None
    pr_number: int | None = None
    try:
        args = parser().parse_args(argv)
        pr_number = args.pr
        repository = os.environ.get("GITHUB_REPOSITORY", "")
        token = os.environ.get("GITHUB_TOKEN", "") or os.environ.get("GH_TOKEN", "")
        api = GitHubApi(
            repository,
            token,
            os.environ.get("GITHUB_API_URL", "https://api.github.com"),
        )
        result = load_result(args.result)
        outcome = publish_review_result(api, args.pr, result)
        print(f"AI final publisher: {outcome}")
        return 0
    except SkipPublication as error:
        print(f"::notice::AI final publisher skipped: {error}", file=sys.stderr)
        return 0
    except PublishError as error:
        if api is not None and pr_number is not None:
            try:
                api.remove_reactions(pr_number)
            except PublishError as cleanup_error:
                print(
                    f"::warning::Unable to clear processing reaction: {cleanup_error}",
                    file=sys.stderr,
                )
        print(f"::error::AI final publisher failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
