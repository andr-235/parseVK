from __future__ import annotations

import importlib.util
import json
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "review.py"
SPEC = importlib.util.spec_from_file_location("ai_review", MODULE_PATH)
assert SPEC and SPEC.loader
review = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = review
SPEC.loader.exec_module(review)


class ReviewTests(unittest.TestCase):
    def setUp(self) -> None:
        self.config = {
            "blocking_severities": ["blocker", "major"],
            "min_blocking_confidence": 0.8,
            "max_findings": 10,
        }

    def test_parse_json_from_markdown_fence(self) -> None:
        payload = {"verdict": "approved", "summary": "ok", "findings": []}
        parsed = review.parse_json(f"```json\n{json.dumps(payload)}\n```")
        self.assertEqual(payload, parsed)

    def test_blocking_verdict_is_computed_by_code(self) -> None:
        raw = {
            "verdict": "approved",
            "summary": "Найдена гонка",
            "findings": [{
                "severity": "major",
                "category": "reliability",
                "path": "services/tasks/worker.py",
                "line": 42,
                "title": "Устаревший worker пишет результат",
                "description": "Lease не проверяется перед записью.",
                "suggestion": "Добавить fencing token.",
                "confidence": 0.95,
            }],
        }
        result = review.validate(raw, ["services/tasks/worker.py"], self.config)
        self.assertEqual("changes_required", result["verdict"])
        self.assertTrue(review.is_blocking(result["findings"][0], self.config))

    def test_low_confidence_major_does_not_block(self) -> None:
        self.assertFalse(review.is_blocking({"severity": "major", "confidence": 0.79}, self.config))

    def test_unchanged_file_finding_is_discarded(self) -> None:
        raw = {
            "summary": "Лишнее замечание",
            "findings": [{
                "severity": "blocker",
                "category": "correctness",
                "path": "unchanged.py",
                "title": "Ошибка",
                "description": "Описание",
                "confidence": 1.0,
            }],
        }
        result = review.validate(raw, ["changed.py"], self.config)
        self.assertEqual([], result["findings"])
        self.assertEqual("approved", result["verdict"])

    def test_issue_marker_is_stable(self) -> None:
        self.assertEqual("<!-- ai-review:pr=321 -->", review.marker(321))


if __name__ == "__main__":
    unittest.main()
