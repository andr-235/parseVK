from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Iterable, Mapping, Sequence
from typing import Any

from .models import Finding, PublishError
from .render import REVIEW_MARKER, render_inline_finding

CANONICAL_MARKER = "<!-- ai-review:canonical -->"
ISSUE_MARKER = "<!-- ai-review:pr={pr_number} -->"


class GitHubApi:
    def __init__(
        self,
        repository: str,
        token: str,
        api_url: str = "https://api.github.com",
    ) -> None:
        if "/" not in repository or not token:
            raise PublishError("repository and GitHub token are required")
        self.repository = repository
        self.owner = repository.split("/", 1)[0]
        self.api_url = api_url.rstrip("/")
        self.headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "parsevk-ai-review-inline-publisher",
        }

    def request(
        self,
        method: str,
        path: str,
        body: Mapping[str, Any] | None = None,
    ) -> Any:
        data = None if body is None else json.dumps(body).encode("utf-8")
        request = urllib.request.Request(
            f"{self.api_url}{path}",
            data=data,
            headers=self.headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = response.read()
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise PublishError(
                f"GitHub API {method} {path} failed: {error.code} {detail}"
            ) from error
        if not payload:
            return None
        return json.loads(payload)

    def paginated(self, path: str) -> Iterable[Any]:
        separator = "&" if "?" in path else "?"
        for page in range(1, 101):
            items = self.request(
                "GET",
                f"{path}{separator}per_page=100&page={page}",
            )
            if not isinstance(items, list):
                raise PublishError(f"expected list from {path}")
            yield from items
            if len(items) < 100:
                return
        raise PublishError(f"pagination limit exceeded for {path}")

    def pull_request(self, number: int) -> Mapping[str, Any]:
        value = self.request("GET", f"/repos/{self.repository}/pulls/{number}")
        if not isinstance(value, Mapping):
            raise PublishError("invalid Pull Request response")
        return value

    def review_exists(self, number: int, head_sha: str) -> bool:
        marker = REVIEW_MARKER.format(head_sha=head_sha)
        return any(
            isinstance(review, Mapping) and marker in str(review.get("body") or "")
            for review in self.paginated(
                f"/repos/{self.repository}/pulls/{number}/reviews"
            )
        )

    def create_review(
        self,
        number: int,
        head_sha: str,
        body: str,
        findings: Sequence[Finding],
    ) -> None:
        comments = [
            {
                "path": finding.file,
                "line": finding.line,
                "side": "RIGHT",
                "body": render_inline_finding(finding),
            }
            for finding in findings
            if finding.line is not None
        ]
        self.request(
            "POST",
            f"/repos/{self.repository}/pulls/{number}/reviews",
            {
                "commit_id": head_sha,
                "body": body,
                "event": "COMMENT",
                "comments": comments,
            },
        )

    def remove_canonical_comments(self, number: int) -> None:
        for comment in self.paginated(
            f"/repos/{self.repository}/issues/{number}/comments"
        ):
            if not isinstance(comment, Mapping):
                continue
            if str(comment.get("body") or "").find(CANONICAL_MARKER) < 0:
                continue
            if str((comment.get("user") or {}).get("login")) != "github-actions[bot]":
                continue
            self.request(
                "DELETE",
                f"/repos/{self.repository}/issues/comments/{comment['id']}",
            )

    def close_legacy_issue(self, number: int) -> None:
        marker = ISSUE_MARKER.format(pr_number=number)
        query = urllib.parse.quote("ai-review")
        path = f"/repos/{self.repository}/issues?state=all&labels={query}"
        for issue in self.paginated(path):
            if not isinstance(issue, Mapping) or "pull_request" in issue:
                continue
            if marker not in str(issue.get("body") or ""):
                continue
            if issue.get("state") != "closed":
                self.request(
                    "PATCH",
                    f"/repos/{self.repository}/issues/{issue['number']}",
                    {"state": "closed", "state_reason": "completed"},
                )
            return

    def cleanup_legacy_output(self, number: int) -> None:
        self.remove_canonical_comments(number)
        self.close_legacy_issue(number)
