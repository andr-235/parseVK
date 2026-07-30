from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .github_api import GitHubApi
from .models import PublishError, ReviewResult, SkipPublication
from .render import render_review_body, split_findings

PUBLISHABLE_VERDICTS = {"changes-required", "findings"}


def nested(value: Mapping[str, Any], *keys: str) -> Any:
    current: Any = value
    for key in keys:
        if not isinstance(current, Mapping):
            return None
        current = current.get(key)
    return current


def validate_pull_request_head(
    api: GitHubApi,
    number: int,
    expected_head: str,
) -> Mapping[str, Any]:
    pull_request = api.pull_request(number)
    current_head = str(nested(pull_request, "head", "sha") or "")
    if current_head != expected_head:
        raise SkipPublication(
            f"obsolete result: expected {expected_head}, current {current_head}"
        )
    if bool(pull_request.get("draft")):
        raise SkipPublication("draft Pull Request is not eligible for publication")
    if nested(pull_request, "head", "repo", "full_name") != api.repository:
        raise SkipPublication("fork Pull Request is not eligible for publication")
    if nested(pull_request, "user", "login") != api.owner:
        raise SkipPublication("Pull Request author is not the repository owner")
    return pull_request


def validate_pull_request(
    api: GitHubApi,
    number: int,
    result: ReviewResult,
) -> Mapping[str, Any]:
    return validate_pull_request_head(api, number, result.head_sha)


def cleanup_legacy_best_effort(api: GitHubApi, number: int, context: str) -> None:
    try:
        api.cleanup_legacy_output(number)
    except PublishError as error:
        print(f"::warning::{context}; legacy cleanup failed: {error}")


def ensure_review(api: GitHubApi, number: int, result: ReviewResult) -> str:
    if api.review_exists(number, result.head_sha):
        return "review already exists"
    inline, overflow = split_findings(result)
    body = render_review_body(result, overflow)
    api.create_review(number, result.head_sha, body, inline)
    return f"published {len(inline)} inline and {len(overflow)} summary findings"


def clear_processing_reaction(
    api: GitHubApi,
    number: int,
    expected_head: str,
) -> str:
    validate_pull_request_head(api, number, expected_head)
    api.remove_reactions(number)
    return "processing reaction cleared for missing artifact"


def publish_review_result(
    api: GitHubApi,
    number: int,
    result: ReviewResult,
) -> str:
    validate_pull_request(api, number, result)

    if result.verdict == "unavailable":
        cleanup_legacy_best_effort(api, number, "Unavailable result suppressed")
        return "unavailable result suppressed"

    if result.verdict == "approved":
        cleanup_legacy_best_effort(api, number, "Approved result processed")
        return "approved result requires no review"

    if result.verdict == "review-required":
        outcome = ensure_review(api, number, result)
        cleanup_legacy_best_effort(api, number, "Manual review requirement published")
        return outcome

    if result.verdict not in PUBLISHABLE_VERDICTS or not result.findings:
        raise PublishError(
            f"verdict {result.verdict!r} requires at least one validated finding"
        )

    outcome = ensure_review(api, number, result)
    cleanup_legacy_best_effort(api, number, "Inline review published")
    return outcome
