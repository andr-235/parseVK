from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ai_review_batch_lib import plan as plan_module

GIT = "/usr/bin/git"


def run_git(repo: Path, *args: str, capture_output: bool = False) -> None:
    subprocess.run(  # noqa: S603 -- fixed git executable, controlled test args
        [GIT, *args], cwd=repo, check=True, capture_output=capture_output
    )


def git_output(repo: Path, *args: str) -> str:
    return subprocess.check_output(  # noqa: S603 -- fixed git executable
        [GIT, *args], cwd=repo, text=True
    ).strip()


class CommitPlanEdgeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = Path(tempfile.mkdtemp())
        run_git(self.repo, "init", capture_output=True)
        run_git(self.repo, "config", "user.email", "review@example.com")
        run_git(self.repo, "config", "user.name", "Reviewer")
        self.base = self._commit("value.txt", "base")

    def _commit(self, filename: str, value: str) -> str:
        path = self.repo / filename
        previous = path.read_text(encoding="utf-8") if path.exists() else ""
        path.write_text(previous + value + "\n", encoding="utf-8")
        run_git(self.repo, "add", filename)
        run_git(self.repo, "commit", "-m", value, capture_output=True)
        return git_output(self.repo, "rev-parse", "HEAD")

    def test_oversized_pr_stays_blocked_after_small_synchronize(self) -> None:
        commits = [self._commit("value.txt", str(index)) for index in range(3)]
        with patch.object(plan_module, "MAX_COMMITS_PER_RUN", 2):
            value = plan_module.build_plan(
                action="synchronize",
                base_sha=self.base,
                before_sha=commits[-2],
                head_sha=commits[-1],
                cwd=self.repo,
            )
        self.assertEqual(value["status"], "oversized")
        self.assertEqual(value["commit_count"], 3)
        self.assertEqual(value["new_commit_count"], 1)

    def test_synchronize_excludes_commits_reachable_from_base(self) -> None:
        run_git(self.repo, "checkout", "-b", "feature", capture_output=True)
        feature_commit = self._commit("feature.txt", "feature")
        run_git(self.repo, "checkout", "master", capture_output=True)
        updated_base = self._commit("base.txt", "base-update")
        run_git(self.repo, "checkout", "feature", capture_output=True)
        run_git(
            self.repo,
            "merge",
            "--no-ff",
            "master",
            "-m",
            "merge base",
            capture_output=True,
        )
        merge_commit = git_output(self.repo, "rev-parse", "HEAD")

        value = plan_module.build_plan(
            action="synchronize",
            base_sha=updated_base,
            before_sha=feature_commit,
            head_sha=merge_commit,
            cwd=self.repo,
        )

        planned = [unit["head_sha"] for unit in value["units"]]
        self.assertEqual(planned, [merge_commit])
        self.assertNotIn(updated_base, planned)


if __name__ == "__main__":
    unittest.main()
