from __future__ import annotations

import urllib.parse
from collections.abc import Iterable, Mapping
from typing import Any, Protocol

CANONICAL_MARKER = "<!-- ai-review:canonical -->"
ISSUE_MARKER = "<!-- ai-review:pr={pr_number} -->"


class LegacyApi(Protocol):
    repository: str

    def request(
        self,
        method: str,
        path: str,
        body: Mapping[str, Any] | None = None,
    ) -> Any: ...

    def paginated(self, path: str) -> Iterable[Any]: ...


def remove_canonical_comments(api: LegacyApi, number: int) -> None:
    path = f"/repos/{api.repository}/issues/{number}/comments"
    for comment in api.paginated(path):
        if not isinstance(comment, Mapping):
            continue
        if CANONICAL_MARKER not in str(comment.get("body") or ""):
            continue
        user = comment.get("user")
        if not isinstance(user, Mapping) or user.get("login") != "github-actions[bot]":
            continue
        api.request(
            "DELETE",
            f"/repos/{api.repository}/issues/comments/{comment['id']}",
        )


def close_legacy_issue(api: LegacyApi, number: int) -> None:
    marker = ISSUE_MARKER.format(pr_number=number)
    label = urllib.parse.quote("ai-review")
    path = f"/repos/{api.repository}/issues?state=all&labels={label}"
    for issue in api.paginated(path):
        if not isinstance(issue, Mapping) or "pull_request" in issue:
            continue
        if marker not in str(issue.get("body") or ""):
            continue
        if issue.get("state") != "closed":
            api.request(
                "PATCH",
                f"/repos/{api.repository}/issues/{issue['number']}",
                {"state": "closed", "state_reason": "completed"},
            )
        return


def cleanup_legacy_output(api: LegacyApi, number: int) -> None:
    remove_canonical_comments(api, number)
    close_legacy_issue(api, number)
