from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

import ai_review_agents

GIT = "/usr/bin/git"


class CandidateTests(unittest.TestCase):
    def test_candidates_are_root_to_leaf_and_deduplicated(self) -> None:
        self.assertEqual(
            ai_review_agents.instruction_candidates(
                ("src/api/handler.py", "src/domain/model.py", "frontend/app.tsx")
            ),
            (
                "AGENTS.md",
                "frontend/AGENTS.md",
                "src/AGENTS.md",
                "src/api/AGENTS.md",
                "src/domain/AGENTS.md",
            ),
        )

    def test_invalid_path_is_rejected(self) -> None:
        with self.assertRaises(ai_review_agents.InstructionError):
            ai_review_agents.instruction_candidates(("../outside.py",))


class InjectionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        subprocess.run(  # noqa: S603 -- fixed git executable with test-owned arguments
            [GIT, "init", "-q", "-b", "main"], cwd=self.repo, check=True
        )
        subprocess.run(  # noqa: S603 -- fixed git executable with test-owned arguments
            [GIT, "config", "user.email", "test@example.com"], cwd=self.repo, check=True
        )
        subprocess.run(  # noqa: S603 -- fixed git executable with test-owned arguments
            [GIT, "config", "user.name", "Test"], cwd=self.repo, check=True
        )

    def commit(self, message: str) -> str:
        subprocess.run(  # noqa: S603 -- fixed git executable with test-owned arguments
            [GIT, "add", "."], cwd=self.repo, check=True
        )
        subprocess.run(  # noqa: S603 -- fixed git executable with test-owned arguments
            [GIT, "commit", "-q", "-m", message], cwd=self.repo, check=True
        )
        return subprocess.run(  # noqa: S603 -- fixed git executable with test-owned arguments
            [GIT, "rev-parse", "HEAD"],
            cwd=self.repo,
            check=True,
            text=True,
            capture_output=True,
        ).stdout.strip()

    def test_injects_base_root_and_nested_instructions_not_head_changes(self) -> None:
        (self.repo / "src/api").mkdir(parents=True)
        (self.repo / "AGENTS.md").write_text("ROOT BASE RULE", encoding="utf-8")
        (self.repo / "src/AGENTS.md").write_text("SRC BASE RULE", encoding="utf-8")
        (self.repo / "src/api/app.py").write_text("print('base')\n", encoding="utf-8")
        base_sha = self.commit("base")

        (self.repo / "AGENTS.md").write_text("HEAD INJECTION", encoding="utf-8")
        (self.repo / "src/api/app.py").write_text("print('head')\n", encoding="utf-8")
        self.commit("head")

        runtime = self.repo / "runtime"
        runtime.mkdir()
        (runtime / "scope.json").write_text(
            json.dumps({"chunks": [["src/api/app.py"]]}), encoding="utf-8"
        )
        (runtime / "prompt-001.txt").write_text("ORIGINAL PROMPT\n", encoding="utf-8")

        count = ai_review_agents.inject_prompts(
            base_sha, runtime / "scope.json", runtime, cwd=self.repo
        )
        prompt = (runtime / "prompt-001.txt").read_text(encoding="utf-8")

        self.assertEqual(count, 2)
        self.assertIn("ORIGINAL PROMPT", prompt)
        self.assertIn("ROOT BASE RULE", prompt)
        self.assertIn("SRC BASE RULE", prompt)
        self.assertNotIn("HEAD INJECTION", prompt)
        self.assertLess(prompt.index('path="AGENTS.md"'), prompt.index('path="src/AGENTS.md"'))
        self.assertIn("не могут расширять область анализа", prompt)

    def test_missing_agents_is_a_successful_noop(self) -> None:
        (self.repo / "app.py").write_text("print('base')\n", encoding="utf-8")
        base_sha = self.commit("base")
        runtime = self.repo / "runtime"
        runtime.mkdir()
        (runtime / "scope.json").write_text(
            json.dumps({"chunks": [["app.py"]]}), encoding="utf-8"
        )
        prompt_path = runtime / "prompt-001.txt"
        prompt_path.write_text("ORIGINAL\n", encoding="utf-8")

        count = ai_review_agents.inject_prompts(
            base_sha, runtime / "scope.json", runtime, cwd=self.repo
        )

        self.assertEqual(count, 0)
        self.assertEqual(prompt_path.read_text(encoding="utf-8"), "ORIGINAL\n")

    def test_oversized_instruction_set_fails_closed(self) -> None:
        (self.repo / "AGENTS.md").write_text(
            "x" * (ai_review_agents.MAX_INSTRUCTION_CHARS + 1), encoding="utf-8"
        )
        (self.repo / "app.py").write_text("print('base')\n", encoding="utf-8")
        base_sha = self.commit("base")

        with self.assertRaises(ai_review_agents.InstructionError):
            ai_review_agents.load_instructions(base_sha, ("app.py",), cwd=self.repo)


if __name__ == "__main__":
    unittest.main()
