from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import ai_review


class DiffParserTests(unittest.TestCase):
    def test_tracks_only_new_side_lines(self) -> None:
        diff = """diff --git a/app.py b/app.py
--- a/app.py
+++ b/app.py
@@ -10,2 +10,3 @@
-old
+new
+extra
 context
"""
        self.assertEqual(ai_review.parse_changed_lines(diff), {"app.py": (10, 11)})

    def test_deleted_file_has_no_new_lines(self) -> None:
        diff = """diff --git a/old.py b/old.py
--- a/old.py
+++ /dev/null
@@ -1 +0,0 @@
-old
"""
        self.assertEqual(ai_review.parse_changed_lines(diff), {})


class ResultTests(unittest.TestCase):
    def scope(self) -> ai_review.Scope:
        return ai_review.Scope(
            schema_version=1,
            base_sha="a" * 40,
            head_sha="b" * 40,
            status="review",
            reason="review-required",
            reviewable_files=("src/app.py", "config/settings.yml"),
            changed_lines=3,
            line_map={"src/app.py": (10, 11), "config/settings.yml": (4,)},
        )

    def write_events(self, payload: dict) -> Path:
        handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False)
        event = {"type": "text", "part": {"text": json.dumps(payload, ensure_ascii=False)}}
        handle.write(json.dumps(event, ensure_ascii=False) + "\n")
        handle.close()
        path = Path(handle.name)
        self.addCleanup(path.unlink, missing_ok=True)
        return path

    def test_empty_result_is_approved(self) -> None:
        events = self.write_events(
            {"status": "completed", "head_sha": "b" * 40, "summary": "ok", "findings": []}
        )
        result = ai_review.finalize_result(self.scope(), events, 0)
        self.assertEqual(result.verdict, "approved")
        self.assertEqual(result.reaction, "+1")

    def test_minor_is_non_blocking_and_confused(self) -> None:
        events = self.write_events(
            {
                "status": "completed",
                "head_sha": "b" * 40,
                "summary": "minor",
                "findings": [
                    {
                        "severity": "minor",
                        "file": "src/app.py",
                        "line": 10,
                        "scenario": "scenario",
                        "impact": "impact",
                        "fix": "fix",
                        "confidence": 0.95,
                    }
                ],
            }
        )
        result = ai_review.finalize_result(self.scope(), events, 0)
        self.assertEqual(result.verdict, "findings")
        self.assertEqual(result.reaction, "confused")
        self.assertEqual(result.blocking_count, 0)

    def test_major_blocks(self) -> None:
        events = self.write_events(
            {
                "status": "completed",
                "head_sha": "b" * 40,
                "summary": "major",
                "findings": [
                    {
                        "severity": "major",
                        "file": "src/app.py",
                        "line": 11,
                        "scenario": "scenario",
                        "impact": "impact",
                        "fix": "fix",
                        "confidence": 0.90,
                    }
                ],
            }
        )
        result = ai_review.finalize_result(self.scope(), events, 0)
        self.assertEqual(result.verdict, "changes-required")
        self.assertEqual(result.reaction, "-1")

    def test_wrong_head_is_unavailable(self) -> None:
        events = self.write_events(
            {"status": "completed", "head_sha": "c" * 40, "summary": "ok", "findings": []}
        )
        result = ai_review.finalize_result(self.scope(), events, 0)
        self.assertEqual(result.verdict, "unavailable")

    def test_finding_outside_changed_hunk_is_dropped(self) -> None:
        events = self.write_events(
            {
                "status": "completed",
                "head_sha": "b" * 40,
                "summary": "outside",
                "findings": [
                    {
                        "severity": "major",
                        "file": "src/app.py",
                        "line": 100,
                        "scenario": "scenario",
                        "impact": "impact",
                        "fix": "fix",
                        "confidence": 0.99,
                    }
                ],
            }
        )
        result = ai_review.finalize_result(self.scope(), events, 0)
        self.assertEqual(result.verdict, "approved")
        self.assertEqual(result.dropped_findings, 1)

    def test_file_level_config_finding_is_allowed(self) -> None:
        events = self.write_events(
            {
                "status": "completed",
                "head_sha": "b" * 40,
                "summary": "config",
                "findings": [
                    {
                        "severity": "major",
                        "file": "config/settings.yml",
                        "line": None,
                        "scenario": "scenario",
                        "impact": "impact",
                        "fix": "fix",
                        "confidence": 0.99,
                    }
                ],
            }
        )
        result = ai_review.finalize_result(self.scope(), events, 0)
        self.assertEqual(result.verdict, "changes-required")

    def test_prompt_injection_text_is_sanitized(self) -> None:
        events = self.write_events(
            {
                "status": "completed",
                "head_sha": "b" * 40,
                "summary": "summary",
                "findings": [
                    {
                        "severity": "minor",
                        "file": "src/app.py",
                        "line": 10,
                        "scenario": "@owner <script>alert(1)</script>\nnext",
                        "impact": "`code`",
                        "fix": "fix",
                        "confidence": 0.99,
                    }
                ],
            }
        )
        result = ai_review.finalize_result(self.scope(), events, 0)
        finding = result.findings[0]
        self.assertNotIn("<script>", finding.scenario)
        self.assertIn("@\u200bowner", finding.scenario)
        self.assertNotIn("`", finding.impact)

    def test_malformed_events_are_unavailable(self) -> None:
        handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False)
        handle.write("not-json\n")
        handle.close()
        path = Path(handle.name)
        self.addCleanup(path.unlink, missing_ok=True)
        result = ai_review.finalize_result(self.scope(), path, 0)
        self.assertEqual(result.verdict, "unavailable")


class PathTests(unittest.TestCase):
    def test_exclusions(self) -> None:
        self.assertFalse(ai_review.is_reviewable_path("README.md"))
        self.assertFalse(ai_review.is_reviewable_path("docs/guide.txt"))
        self.assertFalse(ai_review.is_reviewable_path(".github/workflows/ai-code-review.yml"))
        self.assertTrue(ai_review.is_reviewable_path("src/app.py"))


if __name__ == "__main__":
    unittest.main()
