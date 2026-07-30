from __future__ import annotations

import json
import urllib.error
import urllib.request
from collections.abc import Iterable, Mapping, Sequence
from typing import Any

from .legacy import cleanup_legacy_output
from .models import Finding, PublishError
from .reactions import remove_reactions as remove_bot_reactions
from .reactions import set_reaction as replace_bot_reaction
from .render import REVIEW_MARKER, render_inline_finding


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
        for review in self.paginated(
            f"/repos/{self.repository}/pulls/{number}/reviews"
        ):
            if not isinstance(review, Mapping):
                continue
            user = review.get("user")
            if not isinstance(user, Mapping):
                continue
            if user.get("login") != "github-actions[bot]":
                continue
            if marker in str(review.get("body") or ""):
                return True
        return False

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

    def set_reaction(self, number: int, content: str) -> None:
        replace_bot_reaction(self, number, content)

    def remove_reactions(self, number: int) -> None:
        remove_bot_reactions(self, number)

    def cleanup_legacy_output(self, number: int) -> None:
        cleanup_legacy_output(self, number)
