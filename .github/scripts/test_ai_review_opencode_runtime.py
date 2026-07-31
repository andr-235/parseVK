from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ai_review_agents_install import install

SCRIPTS = Path(__file__).resolve().parent


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
                (directory / "opencode-events-001-attempt-1.jsonl").is_file()
            )


if __name__ == "__main__":
    unittest.main()
