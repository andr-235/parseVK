from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from ai_review_ui.models import Finding, PublishError, ReviewResult, load_result
from ai_review_ui.publish import publish_inline_review
from ai_review_ui.render import (
    MAX_INLINE_COMMENTS,
    render_inline_finding,
    render_review_body,
    split_findings,
)


class FakeApi:
    repository = "andr-235/parseVK"
    owner = "andr-235"

    def __init__(self, head_sha: str) -> None:
        self.head_sha = head_sha
        self.exists = False
        self.created: tuple | None = None
        self.cleanup_calls = 0

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


def finding(
    *,
    severity: str = "major",
    line: int | None = 10,
    index: int = 1,
    scenario: str | None = None,
    impact: str | None = None,
    fix: str | None = None,
) -> Finding:
    return Finding(
        severity=severity,
        file=f"src/file_{index}.py",
        line=line,
        scenario=scenario or f"Сценарий дефекта {index}",
        impact=impact or f"Последствие {index}",
        fix=fix or f"Добавьте проверку {index}. Затем обновите тесты.",
        confidence=0.96,
    )


def result(*findings: Finding, verdict: str = "changes-required") -> ReviewResult:
    return ReviewResult(
        head_sha="a" * 40,
        status="completed",
        reason="review-completed",
        summary="summary",
        verdict=verdict,
        findings=tuple(findings),
        blocking_count=sum(item.severity in {"blocker", "major"} for item in findings),
    )


class RenderTests(unittest.TestCase):
    def test_inline_comment_uses_structured_github_alerts(self) -> None:
        body = render_inline_finding(finding())
        self.assertIn("### 🟠 Major · Добавьте проверку 1", body)
        self.assertIn("> [!NOTE]\n> **Что не так**", body)
        self.assertIn("> [!WARNING]\n> **Последствия**", body)
        self.assertIn("> [!TIP]\n> **Как исправить**", body)
        self.assertIn("📈 Уверенность: 96%", body)
        self.assertIn("🧠 Big Pickle", body)
        self.assertIn("🛡️ diff-фильтры parseVK", body)

    def test_multiline_model_text_stays_inside_alert(self) -> None:
        body = render_inline_finding(
            finding(scenario="Первая строка\n\nВторая строка")
        )
        self.assertIn("> Первая строка\n>\n> Вторая строка", body)

    def test_overflow_is_kept_in_structured_review_summary(self) -> None:
        findings = tuple(finding(index=index) for index in range(1, 15))
        inline, overflow = split_findings(result(*findings))
        self.assertEqual(len(inline), MAX_INLINE_COMMENTS)
        self.assertEqual(len(overflow), 2)
        body = render_review_body(result(*findings), overflow)
        self.assertIn("Остальные замечания (2)", body)
        self.assertIn("> [!CAUTION]\n> **Итог ревью**", body)
        self.assertIn("Проверен commit", body)
        self.assertIn("📄 `src/file_13.py` · строка 10", body)


class ModelTests(unittest.TestCase):
    def test_load_result_rejects_path_traversal(self) -> None:
        payload = {
            "head_sha": "a" * 40,
            "status": "completed",
            "reason": "review-completed",
            "summary": "summary",
            "verdict": "findings",
            "blocking_count": 0,
            "findings": [
                {
                    "severity": "minor",
                    "file": "../secret.py",
                    "line": 1,
                    "scenario": "scenario",
                    "impact": "impact",
                    "fix": "fix",
                    "confidence": 0.95,
                }
            ],
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "result.json"
            path.write_text(json.dumps(payload), encoding="utf-8")
            with self.assertRaises(PublishError):
                load_result(path)


class PublishTests(unittest.TestCase):
    def test_publishes_one_review_and_cleans_legacy_output(self) -> None:
        api = FakeApi("a" * 40)
        outcome = publish_inline_review(api, 42, result(finding()))
        self.assertIn("published 1 inline", outcome)
        self.assertIsNotNone(api.created)
        self.assertEqual(api.cleanup_calls, 1)

    def test_existing_review_is_idempotent(self) -> None:
        api = FakeApi("a" * 40)
        api.exists = True
        outcome = publish_inline_review(api, 42, result(finding()))
        self.assertEqual(outcome, "review already exists")
        self.assertIsNone(api.created)
        self.assertEqual(api.cleanup_calls, 1)

    def test_obsolete_result_is_rejected(self) -> None:
        api = FakeApi("b" * 40)
        with self.assertRaises(PublishError):
            publish_inline_review(api, 42, result(finding()))

    def test_approved_result_is_not_published(self) -> None:
        api = FakeApi("a" * 40)
        outcome = publish_inline_review(api, 42, result(verdict="approved"))
        self.assertEqual(outcome, "skipped verdict approved")
        self.assertIsNone(api.created)
