#!/usr/bin/env python3
"""Publish validated commit-scoped AI review results from the default branch."""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

from ai_review_ui.github_api import GitHubApi
from ai_review_ui.models import PublishError, ReviewResult, SkipPublication
from ai_review_ui.publish import cleanup_legacy_best_effort, ensure_review, nested
from ai_review_ui.render import render_review_body

PUBLISHABLE = {"changes-required", "findings", "review-required"}


def _load(path: Path) -> Mapping[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise PublishError(f"cannot read commit review batch: {error}") from error
    if not isinstance(value, Mapping):
        raise PublishError("commit review batch must be an object")
    return value


def _pull_request_commits(api: GitHubApi, number: int) -> set[str]:
    pull_request = api.pull_request(number)
    if bool(pull_request.get("draft")):
        raise SkipPublication("draft Pull Request is not eligible for publication")
    if nested(pull_request, "head", "repo", "full_name") != api.repository:
        raise SkipPublication("fork Pull Request is not eligible for publication")
    if nested(pull_request, "user", "login") != api.owner:
        raise SkipPublication("Pull Request author is not the repository owner")

    commits = set()
    for item in api.paginated(f"/repos/{api.repository}/pulls/{number}/commits"):
        if isinstance(item, Mapping) and isinstance(item.get("sha"), str):
            commits.add(item["sha"])
    return commits


def _publish_one(api: GitHubApi, number: int, result: ReviewResult) -> str:
    if result.verdict not in PUBLISHABLE:
        return f"{result.head_sha[:10]}: no review comment required"
    if result.verdict in {"changes-required", "findings"} and not result.findings:
        raise PublishError(
            f"{result.head_sha[:10]}: verdict {result.verdict} has no findings"
        )
    try:
        return f"{result.head_sha[:10]}: {ensure_review(api, number, result)}"
    except PublishError as error:
        if api.review_exists(number, result.head_sha):
            return f"{result.head_sha[:10]}: review appeared after API error"
        body = render_review_body(result, result.findings)
        api.create_review(number, result.head_sha, body, ())
        return (
            f"{result.head_sha[:10]}: published summary fallback "
            f"after inline failure: {error}"
        )


def publish_batch(api: GitHubApi, number: int, path: Path) -> str:
    batch = _load(path)
    commit_shas = _pull_request_commits(api, number)
    raw_results = batch.get("commit_results")
    if not isinstance(raw_results, list):
        raw_results = []

    results = [ReviewResult.from_value(value) for value in raw_results]
    if not results and batch.get("verdict") == "review-required":
        results = [ReviewResult.from_value(dict(batch))]

    outcomes = []
    skipped = 0
    review_comments = 0
    for result in results:
        if result.head_sha not in commit_shas:
            skipped += 1
            continue
        outcomes.append(_publish_one(api, number, result))
        if result.verdict in PUBLISHABLE:
            review_comments += 1

    cleanup_legacy_best_effort(api, number, "Commit review batch published")
    return (
        f"handled={len(outcomes)} reviews={review_comments} skipped={skipped}; "
        + ("; ".join(outcomes) if outcomes else "no review comments")
    )


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description=__doc__)
    root.add_argument("--pr", type=int, required=True)
    root.add_argument("--result", type=Path, required=True)
    return root


def main(argv: Sequence[str] | None = None) -> int:
    try:
        args = parser().parse_args(argv)
        api = GitHubApi(
            os.environ.get("GITHUB_REPOSITORY", ""),
            os.environ.get("GITHUB_TOKEN", "") or os.environ.get("GH_TOKEN", ""),
            os.environ.get("GITHUB_API_URL", "https://api.github.com"),
        )
        print(f"AI commit publisher: {publish_batch(api, args.pr, args.result)}")
        return 0
    except SkipPublication as error:
        print(f"::notice::AI commit publisher skipped: {error}", file=sys.stderr)
        return 0
    except PublishError as error:
        print(f"::error::AI commit publisher failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
