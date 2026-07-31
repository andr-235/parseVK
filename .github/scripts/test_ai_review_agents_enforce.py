from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from ai_review_agents_enforce import (
    collect_findings,
    effective_rule,
    is_exempt,
    merge_result,
    parse_rule,
)


class RuleParsingTests(unittest.TestCase):
    def test_reads_upper_bound_from_existing_agents_wording(self) -> None:
        rule = parse_rule(
            "**Размер файла:** не более 100-150 строк. "
            "Исключения: конфиги, миграции alembic, автогенерация.",
            "AGENTS.md",
        )
        self.assertIsNotNone(rule)
        assert rule is not None
        self.assertEqual(rule.limit, 150)
        self.assertTrue(rule.exclude_configs)
        self.assertTrue(rule.exclude_alembic)
        self.assertTrue(rule.exclude_generated)

    def test_deeper_agents_overrides_limit_and_inherits_exceptions(self) -> None:
        root = parse_rule(
            "Размер файла: не более 150 строк. Исключения: конфиги, автогенерация.",
            "AGENTS.md",
        )
        rule = parse_rule("File size: maximum 80 lines.", "services/x/AGENTS.md", root)
        self.assertEqual(rule.limit, 80)
        self.assertEqual(rule.source, "services/x/AGENTS.md")
        self.assertTrue(rule.exclude_configs)
        self.assertTrue(rule.exclude_generated)

    def test_no_rule_does_not_invent_limit(self) -> None:
        self.assertIsNone(effective_rule((("AGENTS.md", "Пишите тесты."),)))


class FindingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = Path(tempfile.mkdtemp())

    @staticmethod
    def loader(_base: str, paths: list[str], **_kwargs):
        limit = 80 if paths[0].startswith("nested/") else 150
        return (("AGENTS.md", f"Размер файла: не более {limit} строк."),)

    def scope(self, path: str) -> dict:
        return {"reviewable_files": [path], "line_map": {path: [5]}}

    def test_changed_source_file_over_limit_is_blocking(self) -> None:
        path = "services/app.py"
        target = self.repo / path
        target.parent.mkdir(parents=True)
        target.write_text("x\n" * 151, encoding="utf-8")
        findings = collect_findings("a" * 40, self.scope(path), self.repo, self.loader)
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0]["severity"], "major")
        self.assertEqual(findings[0]["line"], 5)
        self.assertIn("151", findings[0]["scenario"])
        self.assertIn("150", findings[0]["scenario"])

    def test_nested_rule_is_applied(self) -> None:
        path = "nested/module.py"
        target = self.repo / path
        target.parent.mkdir(parents=True)
        target.write_text("x\n" * 81, encoding="utf-8")
        findings = collect_findings("a" * 40, self.scope(path), self.repo, self.loader)
        self.assertEqual(len(findings), 1)
        self.assertIn("80", findings[0]["scenario"])

    def test_explicit_exceptions_are_not_reported(self) -> None:
        rule = parse_rule(
            "Размер файла: не более 10 строк. Исключения: конфиги, миграции alembic, автогенерация.",
            "AGENTS.md",
        )
        assert rule is not None
        self.assertTrue(is_exempt("config/settings.yaml", "x\n" * 20, rule))
        self.assertTrue(is_exempt("alembic/versions/001.py", "x\n" * 20, rule))
        self.assertTrue(is_exempt("client_generated.py", "# Generated file\n", rule))

    def test_merge_replaces_model_duplicate_and_blocks(self) -> None:
        deterministic = [{
            "severity": "major", "file": "app.py", "line": 1,
            "scenario": "Файл содержит 151 строку.", "impact": "Нарушение AGENTS.md.",
            "fix": "Разделите файл.", "confidence": 1.0,
        }]
        result = {
            "status": "completed", "reason": "review-completed", "findings": [{
                "severity": "major", "file": "app.py", "line": 1,
                "scenario": "File has 151 lines.", "impact": "Large file.",
                "fix": "Split file.", "confidence": 0.95,
            }],
            "verdict": "approved", "reaction": "+1", "blocking_count": 0,
        }
        merged = merge_result(result, deterministic)
        self.assertEqual(len(merged["findings"]), 1)
        self.assertEqual(merged["verdict"], "changes-required")
        self.assertEqual(merged["blocking_count"], 1)


if __name__ == "__main__":
    unittest.main()
