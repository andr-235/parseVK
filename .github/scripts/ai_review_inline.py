#!/usr/bin/env python3
"""Publish or recover the final validated parseVK AI review result."""

from __future__ import annotations

import argparse
import os
import sys
from collections.abc import Sequence
from pathlib import Path

from ai_review_ui import (
    clear_processing_reaction,
    load_result,
    publish_review_result,
)
from ai_review_ui.github_api import GitHubApi
from ai_review_ui.models import PublishError, SkipPublication


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    commands = root.add_subparsers(dest="command", required=True)

    publish = commands.add_parser("publish")
    publish.add_argument("--pr", type=int, required=True)
    publish.add_argument("--result", type=Path, required=True)

    clear = commands.add_parser("clear-processing")
    clear.add_argument("--pr", type=int, required=True)
    clear.add_argument("--expected-head", required=True)
    return root


def main(argv: Sequence[str] | None = None) -> int:
    api: GitHubApi | None = None
    args: argparse.Namespace | None = None
    try:
        args = parser().parse_args(argv)
        repository = os.environ.get("GITHUB_REPOSITORY", "")
        token = os.environ.get("GITHUB_TOKEN", "") or os.environ.get("GH_TOKEN", "")
        api = GitHubApi(
            repository,
            token,
            os.environ.get("GITHUB_API_URL", "https://api.github.com"),
        )
        if args.command == "clear-processing":
            outcome = clear_processing_reaction(api, args.pr, args.expected_head)
        else:
            outcome = publish_review_result(api, args.pr, load_result(args.result))
        print(f"AI final publisher: {outcome}")
        return 0
    except SkipPublication as error:
        print(f"::notice::AI final publisher skipped: {error}", file=sys.stderr)
        return 0
    except PublishError as error:
        if api is not None and args is not None and args.command == "publish":
            try:
                api.remove_reactions(args.pr)
            except PublishError as cleanup_error:
                print(
                    f"::warning::Unable to clear processing reaction: {cleanup_error}",
                    file=sys.stderr,
                )
        print(f"::error::AI final publisher failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
