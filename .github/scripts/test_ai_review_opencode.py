from __future__ import annotations

import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import ai_review_opencode

HEAD = "a" * 40


def event(status: str = "completed") -> bytes:
    result = {
        "status": status,
        "head_sha": HEAD,
        "summary": "ok",
        "findings": [],
    }
    value = {"type": "text", "part": {"text": json.dumps(result)}}
    return (json.dumps(value) + "\n").encode()


class OpenCodeRunnerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)
        self.diff = self.directory / "review-001.diff"
        self.diff.write_text("diff", encoding="utf-8")
        (self.directory / "scope.json").write_text(
            json.dumps({"chunks": [["app.py"]]}), encoding="utf-8"
        )
        self.arguments = ["run", "--file", str(self.diff)]
        self.prompt = f"Проверяемый HEAD: {HEAD}\n".encode()

    def run_with(self, side_effect):
        stdout = io.BytesIO()
        stderr = io.BytesIO()
        with (
            patch("ai_review_opencode.call", side_effect=side_effect) as mocked,
            patch("ai_review_opencode.sys.stdout") as out,
            patch("ai_review_opencode.sys.stderr") as err,
        ):
            out.buffer = stdout
            err.buffer = stderr
            code = ai_review_opencode.run(self.arguments, self.prompt)
        return code, stdout.getvalue(), stderr.getvalue(), mocked.call_count

    def test_valid_first_attempt_is_not_retried(self) -> None:
        code, stdout, _, calls = self.run_with([(0, event(), b"", 25)])
        self.assertEqual((code, calls), (0, 1))
        self.assertEqual(stdout, event())

    def test_invalid_result_is_retried_once(self) -> None:
        code, stdout, _, calls = self.run_with(
            [(0, b"not-json\n", b"", 30), (0, event(), b"", 20)]
        )
        self.assertEqual((code, calls), (0, 2))
        self.assertEqual(stdout, event())
        self.assertTrue(
            (self.directory / "opencode-attempt-001-1.stdout.jsonl").is_file()
        )
        self.assertTrue(
            (self.directory / "opencode-attempt-001-2.stdout.jsonl").is_file()
        )
        self.assertEqual(list(self.directory.glob("opencode-events-*.jsonl")), [])

    def test_timeout_exhaustion_returns_nonzero(self) -> None:
        code, _, _, calls = self.run_with(
            [(124, b"", b"timeout", 600_000), (124, b"", b"timeout", 300_000)]
        )
        self.assertEqual((code, calls), (124, 2))

    def test_model_technical_error_is_retried(self) -> None:
        code, _, _, calls = self.run_with(
            [(0, event("technical-error"), b"", 10), (0, event(), b"", 10)]
        )
        self.assertEqual((code, calls), (0, 2))

    def test_commit_budget_is_divided_between_four_chunks(self) -> None:
        chunks = [[f"file-{index}.py"] for index in range(4)]
        (self.directory / "scope.json").write_text(
            json.dumps({"chunks": chunks}), encoding="utf-8"
        )
        self.assertEqual(ai_review_opencode.timeouts(self.directory), (150.0, 75.0))


if __name__ == "__main__":
    unittest.main()
