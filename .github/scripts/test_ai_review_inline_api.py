from __future__ import annotations

import unittest
from collections.abc import Iterable
from typing import Any

from ai_review_ui.github_api import GitHubApi
from ai_review_ui.render import REVIEW_MARKER


class ReviewListApi(GitHubApi):
    def __init__(self, reviews: list[dict[str, Any]]) -> None:
        super().__init__("andr-235/parseVK", "token")
        self.reviews = reviews

    def paginated(self, _path: str) -> Iterable[Any]:
        yield from self.reviews


class ReviewDeduplicationTests(unittest.TestCase):
    head_sha = "a" * 40

    def review(self, login: str) -> dict[str, Any]:
        return {
            "body": REVIEW_MARKER.format(head_sha=self.head_sha),
            "user": {"login": login},
        }

    def test_foreign_marker_does_not_suppress_publication(self) -> None:
        api = ReviewListApi([self.review("andr-235")])
        self.assertFalse(api.review_exists(42, self.head_sha))

    def test_github_actions_marker_is_idempotent(self) -> None:
        api = ReviewListApi([self.review("github-actions[bot]")])
        self.assertTrue(api.review_exists(42, self.head_sha))


if __name__ == "__main__":
    unittest.main()
