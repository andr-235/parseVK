from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path

import latest_release

GIT = "/usr/bin/git"


class LatestReleaseTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        subprocess.run([GIT, "init", "-q", "-b", "main"], cwd=self.repo, check=True)
        subprocess.run(
            [GIT, "config", "user.email", "test@example.com"], cwd=self.repo, check=True
        )
        subprocess.run([GIT, "config", "user.name", "Test"], cwd=self.repo, check=True)

    def commit(self, message: str) -> str:
        marker = self.repo / "state.txt"
        marker.write_text(message + "\n", encoding="utf-8")
        subprocess.run([GIT, "add", "state.txt"], cwd=self.repo, check=True)
        subprocess.run([GIT, "commit", "-q", "-m", message], cwd=self.repo, check=True)
        return subprocess.run(
            [GIT, "rev-parse", "HEAD"],
            cwd=self.repo,
            check=True,
            text=True,
            capture_output=True,
        ).stdout.strip()

    def test_non_release_commits_do_not_hide_latest_release(self) -> None:
        source = self.commit("fix(api): repair endpoint")
        release = self.commit("chore(release): 1.2.3 [skip ci]")
        self.commit("refactor(api): extract routes")

        resolved = latest_release.latest_release("main", cwd=self.repo)

        self.assertEqual(resolved.sha, release)
        self.assertEqual(resolved.source_sha, source)
        self.assertEqual(resolved.subject, "chore(release): 1.2.3 [skip ci]")

    def test_newest_reachable_valid_release_wins(self) -> None:
        self.commit("fix(api): first")
        self.commit("chore(release): 1.0.0 [skip ci]")
        source = self.commit("fix(api): second")
        release = self.commit("chore(release): 1.0.1 [skip ci]")
        self.commit("docs: update runbook")

        resolved = latest_release.latest_release("main", cwd=self.repo)

        self.assertEqual((resolved.sha, resolved.source_sha), (release, source))

    def test_release_without_skip_marker_is_ignored(self) -> None:
        source = self.commit("fix(api): first")
        valid = self.commit("chore(release): 1.0.0 [skip ci]")
        self.commit("chore(release): broken")

        resolved = latest_release.latest_release("main", cwd=self.repo)

        self.assertEqual(resolved.sha, valid)
        self.assertEqual(resolved.source_sha, source)

    def test_missing_release_fails_closed(self) -> None:
        self.commit("refactor(api): no release")

        with self.assertRaises(latest_release.ReleaseResolutionError):
            latest_release.latest_release("main", cwd=self.repo)


if __name__ == "__main__":
    unittest.main()
