from __future__ import annotations

import unittest

from ai_review_ui.models import Finding, PublishError, ReviewResult, SkipPublication
from ai_review_ui.publish import publish_review_result


class FakeApi:
    repository = "andr-235/parseVK"
    owner = "andr-235"

    def __init__(self, head_sha: str) -> None:
        self.head_sha = head_sha
        self.exists = False
        self.created: tuple | None = None
        self.cleanup_calls = 0
        self.reaction_calls = 0

    def pull_request(self, _number: int) -> dict:
        return {
            "draft": False,
            "head": {"sha": self.head_sha, "repo": {"full_name": self.repository}},
            "user": {"login": self.owner},
        }

    def review_exists(self, _number: int, _head_sha: str) -> bool:
        return self.exists

    def create_review(self, number: int, head_sha: str, body: str, findings: tuple) -> None:
        self.created = (number, head_sha, body, findings)

    def cleanup_legacy_output(self, _number: int) -> None:
        self.cleanup_calls += 1

    def set_reaction(self, _number: int, _content: str) -> None:
        self.reaction_calls += 1

    def remove_reactions(self, _number: int) -> None:
        self.reaction_calls += 1


def finding(severity: str = "major") -> Finding:
    return Finding(
        severity=severity,
        file="src/file.py",
        line=10,
        scenario="Сценарий дефекта",
        impact="Последствие",
        fix="Добавьте проверку. Затем обновите тесты.",
        confidence=0.96,
    )


def result(*findings: Finding, verdict: str = "changes-required") -> ReviewResult:
    return ReviewResult(
        head_sha="a" * 40,
        status="completed",
        reason="review-completed",
        summary="Подтверждённый итог ревью.",
        verdict=verdict,
        findings=tuple(findings),
        blocking_count=sum(item.severity in {"blocker", "major"} for item in findings),
    )


class PublishTests(unittest.TestCase):
    def test_changes_required_publishes_review_without_touching_status(self) -> None:
        api = FakeApi("a" * 40)
        outcome = publish_review_result(api, 42, result(finding()))
        self.assertIn("published 1 inline", outcome)
        self.assertEqual(api.reaction_calls, 0)
        self.assertEqual(api.cleanup_calls, 1)
        self.assertIsNotNone(api.created)

    def test_minor_findings_publish_review_without_touching_status(self) -> None:
        api = FakeApi("a" * 40)
        publish_review_result(api, 42, result(finding("minor"), verdict="findings"))
        self.assertEqual(api.reaction_calls, 0)
        self.assertIsNotNone(api.created)

    def test_approved_result_requires_no_review_or_status_write(self) -> None:
        api = FakeApi("a" * 40)
        outcome = publish_review_result(api, 42, result(verdict="approved"))
        self.assertEqual(outcome, "approved result requires no review")
        self.assertEqual(api.reaction_calls, 0)
        self.assertIsNone(api.created)
        self.assertEqual(api.cleanup_calls, 1)

    def test_unavailable_result_is_suppressed_without_status_write(self) -> None:
        api = FakeApi("a" * 40)
        publish_review_result(api, 42, result(verdict="unavailable"))
        self.assertEqual(api.reaction_calls, 0)
        self.assertIsNone(api.created)

    def test_manual_review_requirement_is_published_once(self) -> None:
        api = FakeApi("a" * 40)
        publish_review_result(api, 42, result(verdict="review-required"))
        self.assertEqual(api.reaction_calls, 0)
        self.assertIsNotNone(api.created)
        self.assertIn("Требуется ручное ревью", api.created[2])
        self.assertEqual(api.created[3], ())

    def test_existing_review_is_idempotent_without_status_write(self) -> None:
        api = FakeApi("a" * 40)
        api.exists = True
        outcome = publish_review_result(api, 42, result(finding()))
        self.assertEqual(outcome, "review already exists")
        self.assertIsNone(api.created)
        self.assertEqual(api.reaction_calls, 0)
        self.assertEqual(api.cleanup_calls, 1)

    def test_obsolete_result_is_skipped_without_side_effects(self) -> None:
        api = FakeApi("b" * 40)
        with self.assertRaises(SkipPublication):
            publish_review_result(api, 42, result(finding()))
        self.assertEqual(api.reaction_calls, 0)

    def test_findings_verdict_requires_validated_findings(self) -> None:
        api = FakeApi("a" * 40)
        with self.assertRaises(PublishError):
            publish_review_result(api, 42, result(verdict="findings"))


if __name__ == "__main__":
    unittest.main()
