from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .github_api import GitHubApi
from .models import PublishError, ReviewResult
from .render import render_review_body, split_findings

PUBLISHABLE_VERDICTS = {"changes-required", "findings"}


def nested(value: Mapping[str, Any], *keys: str) -> Any:
    current: Any = value
    for key in keys:
        if not isinstance(current, Mapping):
            return None
        current = current.get(key)
    return current


def validate_pull_request(
    api: GitHubApi,
    number: int,
    result: ReviewResult,
) -> Mapping[str, Any]:
    pull_request = api.pull_request(number)
    current_head = str(nested(pull_request, "head", "sha") or "")
    if current_head != result.head_sha:
        raise PublishError(
            f"obsolete result: expected {result.head_sha}, current {current_head}"
        )
    if bool(pull_request.get("draft")):
        raise PublishError("draft Pull Request is not eligible for publication")
    if nested(pull_request, "head", "repo", "full_name") != api.repository:
        raise PublishError("fork Pull Request is not eligible for publication")
    if nested(pull_request, "user", "login") != api.owner:
        raise PublishError("Pull Request author is not the repository owner")
    return pull_request


def publish_inline_review(
    api: GitHubApi,
    number: int,
    result: ReviewResult,
) -> str:
    validate_pull_request(api, number, result)
    if result.verdict not in PUBLISHABLE_VERDICTS or not result.findings:
        return f"skipped verdict {result.verdict}"

    if api.review_exists(number, result.head_sha):
        try:
            api.cleanup_legacy_output(number)
        except PublishError as error:
            print(f"::warning::Inline review exists; legacy cleanup failed: {error}")
        return "review already exists"

    inline, overflow = split_findings(result)
    body = render_review_body(result, overflow)
    try:
        api.create_review(number, result.head_sha, body, inline)
    except PublishError as error:
        print(f"::warning::Inline review publication failed; legacy output kept: {error}")
        return "legacy fallback kept"

    try:
        api.cleanup_legacy_output(number)
    except PublishError as error:
        print(f"::warning::Inline review published; legacy cleanup failed: {error}")
    return f"published {len(inline)} inline and {len(overflow)} summary findings"
