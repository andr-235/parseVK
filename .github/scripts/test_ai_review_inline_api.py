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


class ReactionListApi(GitHubApi):
    def __init__(self) -> None:
        super().__init__("andr-235/parseVK", "token")
        self.requests: list[tuple[str, str, dict | None]] = []

    def paginated(self, _path: str) -> Iterable[Any]:
        yield {"id": 10, "user": {"login": "github-actions[bot]"}}
        yield {"id": 11, "user": {"login": "andr-235"}}

    def request(self, method: str, path: str, body: dict | None = None) -> Any:
        self.requests.append((method, path, body))
        return None


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


class ReactionTests(unittest.TestCase):
    def test_set_reaction_replaces_only_bot_reaction(self) -> None:
        api = ReactionListApi()
        api.set_reaction(42, "-1")
        self.assertEqual(
            api.requests,
            [
                (
                    "DELETE",
                    "/repos/andr-235/parseVK/issues/42/reactions/10",
                    None,
                ),
                (
                    "POST",
                    "/repos/andr-235/parseVK/issues/42/reactions",
                    {"content": "-1"},
                ),
            ],
        )

    def test_remove_reactions_does_not_add_replacement(self) -> None:
        api = ReactionListApi()
        api.remove_reactions(42)
        self.assertEqual(len(api.requests), 1)
        self.assertEqual(api.requests[0][0], "DELETE")


if __name__ == "__main__":
    unittest.main()
