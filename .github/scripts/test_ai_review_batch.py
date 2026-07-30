from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from ai_review_batch_lib.aggregate import build_batch
from ai_review_batch_lib.plan import build_plan

GIT = "/usr/bin/git"


def run_git(repo: Path, *args: str, capture_output: bool = False) -> None:
    subprocess.run(  # noqa: S603 -- fixed git executable, controlled test args
        [GIT, *args], cwd=repo, check=True, capture_output=capture_output
    )


def git_output(repo: Path, *args: str) -> str:
    return subprocess.check_output(  # noqa: S603 -- fixed git executable
        [GIT, *args], cwd=repo, text=True
    ).strip()


class CommitPlanTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = Path(tempfile.mkdtemp())
        run_git(self.repo, "init", capture_output=True)
        for key, value in (
            ("user.email", "review@example.com"),
            ("user.name", "Reviewer"),
        ):
            run_git(self.repo, "config", key, value)
        self.commits = [self._commit(str(index)) for index in range(4)]

    def _commit(self, value: str) -> str:
        path = self.repo / "value.txt"
        previous = path.read_text(encoding="utf-8") if path.exists() else ""
        path.write_text(previous + value + "\n", encoding="utf-8")
        run_git(self.repo, "add", "value.txt")
        run_git(self.repo, "commit", "-m", f"commit {value}", capture_output=True)
        return git_output(self.repo, "rev-parse", "HEAD")

    def test_opened_reviews_every_commit_after_base(self) -> None:
        plan = build_plan(
            action="opened",
            base_sha=self.commits[0],
            before_sha="",
            head_sha=self.commits[3],
            cwd=self.repo,
        )
        self.assertEqual(
            [unit["head_sha"] for unit in plan["units"]], self.commits[1:]
        )

    def test_synchronize_reviews_only_new_commits(self) -> None:
        plan = build_plan(
            action="synchronize",
            base_sha=self.commits[0],
            before_sha=self.commits[1],
            head_sha=self.commits[3],
            cwd=self.repo,
        )
        self.assertEqual(
            [unit["head_sha"] for unit in plan["units"]], self.commits[2:]
        )
        self.assertEqual(plan["units"][0]["base_sha"], self.commits[1])

    def test_force_push_rebuilds_plan_from_current_merge_base(self) -> None:
        old_head = self.commits[3]
        run_git(
            self.repo,
            "checkout",
            "-b",
            "rewritten",
            self.commits[0],
            capture_output=True,
        )
        rewritten = [self._commit("new-a"), self._commit("new-b")]
        plan = build_plan(
            action="synchronize",
            base_sha=self.commits[0],
            before_sha=old_head,
            head_sha=rewritten[-1],
            cwd=self.repo,
        )
        self.assertEqual(
            [unit["head_sha"] for unit in plan["units"]], rewritten
        )
        self.assertEqual(plan["start_sha"], self.commits[0])


class AggregateTests(unittest.TestCase):
    def test_blocking_commit_wins_batch_verdict(self) -> None:
        directory = Path(tempfile.mkdtemp())
        units = [
            {"index": "001", "base_sha": "1" * 40, "head_sha": "2" * 40},
            {"index": "002", "base_sha": "2" * 40, "head_sha": "3" * 40},
        ]
        approved = self._result("2" * 40, "approved", 0)
        blocked = self._result("3" * 40, "changes-required", 1)
        (directory / f"{'2' * 40}.json").write_text(json.dumps(approved))
        (directory / f"{'3' * 40}.json").write_text(json.dumps(blocked))
        batch = build_batch(
            {"run_head_sha": "3" * 40, "status": "review", "units": units},
            directory,
        )
        self.assertEqual(batch["verdict"], "changes-required")
        self.assertEqual(batch["blocking_count"], 1)
        self.assertEqual(len(batch["commit_results"]), 2)

    def test_missing_commit_result_is_visible(self) -> None:
        directory = Path(tempfile.mkdtemp())
        batch = build_batch(
            {
                "run_head_sha": "2" * 40,
                "status": "review",
                "units": [
                    {
                        "index": "001",
                        "base_sha": "1" * 40,
                        "head_sha": "2" * 40,
                    }
                ],
            },
            directory,
        )
        self.assertEqual(batch["verdict"], "unavailable")
        self.assertEqual(batch["commit_results"][0]["reason"], "commit-result-missing")

    @staticmethod
    def _result(head: str, verdict: str, blocking: int) -> dict:
        return {
            "schema_version": 1,
            "status": "completed",
            "reason": "review-completed",
            "head_sha": head,
            "summary": "Итог.",
            "findings": [],
            "dropped_findings": 0,
            "verdict": verdict,
            "reaction": "+1",
            "blocking_count": blocking,
        }


if __name__ == "__main__":
    unittest.main()
