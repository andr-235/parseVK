from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from ai_review_agents_enforce import (
    collect_findings,
    effective_rule,
    is_exempt,
    parse_rule,
    write_event,
)


class RuleParsingTests(unittest.TestCase):
    def test_reads_existing_agents_rule_and_exceptions(self) -> None:
        rule = parse_rule(
            "**Размер файла:** не более 100-150 строк. "
            "Исключения: конфиги, миграции alembic, автогенерация.",
            "AGENTS.md",
        )
        assert rule is not None
        self.assertEqual(rule.limit, 150)
        self.assertTrue(rule.configs)
        self.assertTrue(rule.alembic)
        self.assertTrue(rule.generated)

    def test_deeper_agents_overrides_limit_and_inherits_exceptions(self) -> None:
        root = parse_rule(
            "Размер файла: не более 150 строк. Исключения: конфиги, автогенерация.",
            "AGENTS.md",
        )
        rule = parse_rule("File size: maximum 80 lines.", "src/AGENTS.md", root)
        assert rule is not None
        self.assertEqual((rule.limit, rule.source), (80, "src/AGENTS.md"))
        self.assertTrue(rule.configs)
        self.assertTrue(rule.generated)

    def test_no_rule_does_not_invent_limit(self) -> None:
        self.assertIsNone(effective_rule((("AGENTS.md", "Пишите тесты."),)))


class FindingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = Path(tempfile.mkdtemp())

    @staticmethod
    def loader(_base: str, paths: list[str], **_kwargs):
        limit = 80 if paths[0].startswith("nested/") else 150
        return (("AGENTS.md", f"Размер файла: не более {limit} строк."),)

    @staticmethod
    def scope(path: str) -> dict:
        return {"head_sha": "b" * 40, "reviewable_files": [path], "line_map": {path: [5]}}

    def write(self, path: str, lines: int) -> None:
        target = self.repo / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("x\n" * lines, encoding="utf-8")

    def test_changed_source_file_over_limit_is_major(self) -> None:
        path = "services/app.py"
        self.write(path, 151)
        findings = collect_findings("a" * 40, self.scope(path), self.repo, self.loader)
        self.assertEqual(len(findings), 1)
        self.assertEqual((findings[0]["severity"], findings[0]["line"]), ("major", 5))
        self.assertIn("151", findings[0]["scenario"])
        self.assertIn("150", findings[0]["scenario"])

    def test_nested_rule_is_applied(self) -> None:
        path = "nested/module.py"
        self.write(path, 81)
        findings = collect_findings("a" * 40, self.scope(path), self.repo, self.loader)
        self.assertIn("80", findings[0]["scenario"])

    def test_explicit_exceptions_are_skipped(self) -> None:
        rule = parse_rule(
            "Размер файла: не более 10 строк. Исключения: конфиги, миграции alembic, автогенерация.",
            "AGENTS.md",
        )
        assert rule is not None
        self.assertTrue(is_exempt("config/settings.yaml", "x\n" * 20, rule))
        self.assertTrue(is_exempt("alembic/versions/001.py", "x\n" * 20, rule))
        self.assertTrue(is_exempt("client.py", "# Generated file\n", rule))

    def test_event_uses_standard_model_contract(self) -> None:
        path = "app.py"
        self.write(path, 151)
        scope_path = self.repo / "scope.json"
        scope_path.write_text(json.dumps(self.scope(path)), encoding="utf-8")
        event_dir = self.repo / "events"
        event_dir.mkdir()
        count = write_event(
            "a" * 40,
            scope_path,
            event_dir,
            self.repo,
            loader=self.loader,
        )
        event = json.loads((event_dir / "opencode-events-000.jsonl").read_text())
        result = json.loads(event["part"]["text"])
        self.assertEqual(count, 1)
        self.assertEqual(result["head_sha"], "b" * 40)
        self.assertEqual(result["findings"][0]["severity"], "major")


if __name__ == "__main__":
    unittest.main()
