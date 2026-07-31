from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from ai_review_agents_merge import MergeError, merge_files, merge_result


def finding(path: str) -> dict:
    return {
        "severity": "major",
        "file": path,
        "line": 1,
        "scenario": "Файл содержит 151 строку при лимите 150 из AGENTS.md.",
        "impact": "Нарушено обязательное правило AGENTS.md.",
        "fix": "Разделите файл.",
        "confidence": 1.0,
    }


def result(verdict: str = "unavailable") -> dict:
    return {
        "schema_version": 1,
        "status": "technical-error",
        "reason": "opencode-failed",
        "head_sha": "a" * 40,
        "summary": "Модель недоступна.",
        "findings": [],
        "dropped_findings": 0,
        "verdict": verdict,
        "reaction": "confused",
        "blocking_count": 0,
    }


class MergeTests(unittest.TestCase):
    def test_mandatory_finding_blocks_unavailable_model_result(self) -> None:
        merged = merge_result(
            result(),
            {"head_sha": "a" * 40, "findings": [finding("app.py")]},
        )
        self.assertEqual(merged["verdict"], "changes-required")
        self.assertEqual(merged["reaction"], "-1")
        self.assertEqual(merged["blocking_count"], 1)
        self.assertEqual(len(merged["findings"]), 1)

    def test_all_deterministic_findings_are_preserved(self) -> None:
        findings = [finding(f"file_{index}.py") for index in range(25)]
        merged = merge_result(
            result("approved"),
            {"head_sha": "a" * 40, "findings": findings},
        )
        self.assertEqual(len(merged["findings"]), 25)
        self.assertEqual(merged["blocking_count"], 25)

    def test_model_duplicate_for_same_file_is_removed(self) -> None:
        value = result("changes-required")
        value["findings"] = [finding("app.py")]
        merged = merge_result(
            value,
            {"head_sha": "a" * 40, "findings": [finding("app.py")]},
        )
        self.assertEqual(len(merged["findings"]), 1)

    def test_head_mismatch_fails_closed(self) -> None:
        with self.assertRaises(MergeError):
            merge_result(
                result(),
                {"head_sha": "b" * 40, "findings": [finding("app.py")]},
            )

    def test_missing_findings_file_is_noop(self) -> None:
        directory = Path(tempfile.mkdtemp())
        self.assertEqual(
            merge_files(directory / "result.json", directory / "missing.json"),
            0,
        )


if __name__ == "__main__":
    unittest.main()
