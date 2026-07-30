from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from ai_review_batch_publisher import publish_batch
from ai_review_ui.models import SkipPublication


class FakeApi:
    repository = "andr-235/parseVK"
    owner = "andr-235"

    def __init__(self, current_head: str, commits: set[str]) -> None:
        self.current_head = current_head
        self.commits = commits
        self.created: list[tuple] = []
        self.cleanup_calls = 0
        self.existing: set[str] = set()

    def pull_request(self, _number: int) -> dict:
        return {
            "draft": False,
            "head": {
                "sha": self.current_head,
                "repo": {"full_name": self.repository},
            },
            "user": {"login": self.owner},
        }

    def paginated(self, path: str):
        if path.endswith("/commits"):
            return iter({"sha": sha} for sha in self.commits)
        return iter(())

    def review_exists(self, _number: int, head_sha: str) -> bool:
        return head_sha in self.existing

    def create_review(
        self,
        number: int,
        head_sha: str,
        body: str,
        findings: tuple,
    ) -> None:
        self.created.append((number, head_sha, body, findings))
        self.existing.add(head_sha)

    def cleanup_legacy_output(self, _number: int) -> None:
        self.cleanup_calls += 1


def result(head: str, verdict: str, with_finding: bool = False) -> dict:
    findings = []
    if with_finding:
        findings.append(
            {
                "severity": "major",
                "file": "src/file.py",
                "line": 10,
                "scenario": "Сценарий",
                "impact": "Последствие",
                "fix": "Исправление",
                "confidence": 0.96,
            }
        )
    return {
        "status": "completed",
        "reason": "review-completed",
        "head_sha": head,
        "summary": "Итог commit-review.",
        "verdict": verdict,
        "findings": findings,
        "blocking_count": 1 if with_finding else 0,
    }


class BatchPublisherTests(unittest.TestCase):
    def test_publishes_separate_review_for_each_commit_with_findings(self) -> None:
        first = "1" * 40
        second = "2" * 40
        path = self._batch(
            second,
            [
                result(first, "changes-required", with_finding=True),
                result(second, "approved"),
            ],
        )
        api = FakeApi(second, {first, second})
        outcome = publish_batch(api, 42, path)
        self.assertIn("published=2", outcome)
        self.assertEqual(len(api.created), 1)
        self.assertEqual(api.created[0][1], first)
        self.assertIn("Проверен commit `1111111111`", api.created[0][2])
        self.assertEqual(api.cleanup_calls, 1)

    def test_removed_force_push_commit_is_not_published(self) -> None:
        current = "2" * 40
        removed = "3" * 40
        path = self._batch(
            current,
            [result(removed, "changes-required", with_finding=True)],
        )
        api = FakeApi(current, {current})
        outcome = publish_batch(api, 42, path)
        self.assertIn("skipped=1", outcome)
        self.assertEqual(api.created, [])

    def test_obsolete_batch_does_not_touch_pull_request(self) -> None:
        path = self._batch("1" * 40, [])
        api = FakeApi("2" * 40, {"2" * 40})
        with self.assertRaises(SkipPublication):
            publish_batch(api, 42, path)
        self.assertEqual(api.created, [])
        self.assertEqual(api.cleanup_calls, 0)

    @staticmethod
    def _batch(head: str, commit_results: list[dict]) -> Path:
        path = Path(tempfile.mkdtemp()) / "review-result.json"
        path.write_text(
            json.dumps(
                {
                    "status": "completed",
                    "reason": "commit-review-batch",
                    "head_sha": head,
                    "summary": "Итог batch.",
                    "verdict": "findings",
                    "findings": [],
                    "blocking_count": 0,
                    "commit_results": commit_results,
                }
            ),
            encoding="utf-8",
        )
        return path


if __name__ == "__main__":
    unittest.main()
