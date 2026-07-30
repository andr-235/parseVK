from __future__ import annotations

import unittest

from ai_review_ui.models import SkipPublication
from ai_review_ui.publish import clear_processing_reaction


class FakeApi:
    repository = "andr-235/parseVK"
    owner = "andr-235"

    def __init__(self, head_sha: str) -> None:
        self.head_sha = head_sha
        self.remove_calls = 0

    def pull_request(self, _number: int) -> dict:
        return {
            "draft": False,
            "head": {"sha": self.head_sha, "repo": {"full_name": self.repository}},
            "user": {"login": self.owner},
        }

    def remove_reactions(self, _number: int) -> None:
        self.remove_calls += 1


class MissingArtifactRecoveryTests(unittest.TestCase):
    def test_current_head_clears_processing_reaction(self) -> None:
        api = FakeApi("a" * 40)
        outcome = clear_processing_reaction(api, 42, "a" * 40)
        self.assertEqual(outcome, "processing reaction cleared for missing artifact")
        self.assertEqual(api.remove_calls, 1)

    def test_obsolete_run_does_not_touch_current_reaction(self) -> None:
        api = FakeApi("b" * 40)
        with self.assertRaises(SkipPublication):
            clear_processing_reaction(api, 42, "a" * 40)
        self.assertEqual(api.remove_calls, 0)


if __name__ == "__main__":
    unittest.main()
