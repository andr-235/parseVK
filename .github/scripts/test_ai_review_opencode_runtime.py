from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import ai_review_opencode
from ai_review_agents_install import install

SCRIPTS = Path(__file__).resolve().parent


class TimeoutBudgetTests(unittest.TestCase):
    @staticmethod
    def write_scope(directory: Path, chunk_count: int) -> None:
        chunks = [[f"service-{index}.py"] for index in range(chunk_count)]
        (directory / "scope.json").write_text(
            json.dumps({"chunks": chunks}), encoding="utf-8"
        )

    def test_default_budget_is_nine_hundred_seconds(self) -> None:
        with tempfile.TemporaryDirectory() as value:
            directory = Path(value)
            self.write_scope(directory, 1)
            with patch.dict(os.environ, {}, clear=True):
                primary, retry = ai_review_opencode.timeouts(directory)
            self.assertEqual((primary, retry), (600.0, 300.0))
            self.assertEqual(primary + retry, 900.0)

    def test_budget_is_divided_across_review_chunks(self) -> None:
        with tempfile.TemporaryDirectory() as value:
            directory = Path(value)
            self.write_scope(directory, 4)
            with patch.dict(os.environ, {}, clear=True):
                primary, retry = ai_review_opencode.timeouts(directory)
            self.assertEqual((primary, retry), (150.0, 75.0))
            self.assertEqual((primary + retry) * 4, 900.0)

    def test_environment_overrides_are_divided_across_chunks(self) -> None:
        with tempfile.TemporaryDirectory() as value:
            directory = Path(value)
            self.write_scope(directory, 3)
            with patch.dict(
                os.environ,
                {
                    "AI_REVIEW_PRIMARY_TIMEOUT": "90",
                    "AI_REVIEW_RETRY_TIMEOUT": "30",
                },
                clear=True,
            ):
                primary, retry = ai_review_opencode.timeouts(directory)
            self.assertEqual((primary, retry), (30.0, 10.0))


class OpenCodeRuntimeTests(unittest.TestCase):
    def test_bash_function_runs_bounded_wrapper(self) -> None:
        with tempfile.TemporaryDirectory() as value:
            directory = Path(value)
            (directory / "ai_review.py").write_text(
                (SCRIPTS / "ai_review.py").read_text(), encoding="utf-8"
            )
            sources = {
                path: (SCRIPTS / Path(path).name).read_text(encoding="utf-8")
                for path in (
                    ".github/scripts/ai_review_agents_wrapper.py",
                    ".github/scripts/ai_review_agents_merge.py",
                    ".github/scripts/ai_review_opencode.py",
                )
            }
            with (
                patch(
                    "ai_review_agents_install.read_at_ref",
                    side_effect=lambda _base, path, _repo: sources[path],
                ),
                patch.dict(
                    os.environ,
                    {"GITHUB_ENV": str(directory / "github-env")},
                    clear=False,
                ),
            ):
                install("a" * 40, directory, directory)
            fake = directory / "fake-opencode"
            result = {
                "status": "completed",
                "head_sha": "a" * 40,
                "summary": "ok",
                "findings": [],
            }
            event = {"type": "text", "part": {"text": json.dumps(result)}}
            fake.write_text(
                "#!/usr/bin/env python3\n"
                f"print({json.dumps(json.dumps(event))})\n",
                encoding="utf-8",
            )
            fake.chmod(0o755)
            diff = directory / "review-001.diff"
            diff.write_text("diff", encoding="utf-8")
            (directory / "scope.json").write_text(
                json.dumps({"chunks": [["app.py"]]}), encoding="utf-8"
            )
            env = os.environ | {
                "BASH_ENV": str(directory / "ai-review-bash-env.sh"),
                "AI_REVIEW_OPENCODE_BIN": str(fake),
            }
            completed = subprocess.run(  # noqa: S603 -- controlled test runtime
                ["/usr/bin/bash", "-c", f'opencode run --file "{diff}"'],
                input=f"Проверяемый HEAD: {'a' * 40}\n",
                text=True,
                capture_output=True,
                check=False,
                env=env,
            )
            self.assertEqual(completed.returncode, 0, completed.stderr)
            self.assertIn('"type": "text"', completed.stdout)
            self.assertTrue(
                (directory / "opencode-attempt-001-1.stdout.jsonl").is_file()
            )
            self.assertEqual(list(directory.glob("opencode-events-*.jsonl")), [])


if __name__ == "__main__":
    unittest.main()
