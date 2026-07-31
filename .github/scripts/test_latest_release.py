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
        subprocess.run(  # noqa: S603 -- fixed executable with test-owned arguments
            [GIT, "init", "-q", "-b", "main"], cwd=self.repo, check=True
        )
        subprocess.run(  # noqa: S603 -- fixed executable with test-owned arguments
            [GIT, "config", "user.email", "test@example.com"], cwd=self.repo, check=True
        )
        subprocess.run(  # noqa: S603 -- fixed executable with test-owned arguments
            [GIT, "config", "user.name", "Test"], cwd=self.repo, check=True
        )

    def commit(self, message: str) -> str:
        marker = self.repo / "state.txt"
        marker.write_text(message + "\n", encoding="utf-8")
        subprocess.run(  # noqa: S603 -- fixed executable with test-owned arguments
            [GIT, "add", "state.txt"], cwd=self.repo, check=True
        )
        subprocess.run(  # noqa: S603 -- fixed executable with test-owned arguments
            [GIT, "commit", "-q", "-m", message], cwd=self.repo, check=True
        )
        return subprocess.run(  # noqa: S603 -- fixed executable with test-owned arguments
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


class WorkflowContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        root = Path(__file__).resolve().parents[2]
        workflows = root / ".github/workflows"
        cls.deploy = (workflows / "deploy.yml").read_text(encoding="utf-8")
        cls.coordinator = (workflows / "release-deploy-coordinator.yml").read_text(
            encoding="utf-8"
        )
        cls.full_ci = (workflows / "ci.yml").read_text(encoding="utf-8")
        cls.security = (workflows / "security.yml").read_text(encoding="utf-8")

    def test_release_consumers_use_trusted_resolver(self) -> None:
        for workflow in (self.deploy, self.coordinator, self.full_ci, self.security):
            self.assertIn(".github/scripts/latest_release.py", workflow)
            self.assertIn("LATEST_RELEASE_SHA", workflow)

    def test_manual_deploy_is_bound_to_expected_latest_release(self) -> None:
        self.assertIn("deployment: \"latest-release\"", self.coordinator)
        self.assertIn("expected_release_sha", self.coordinator)
        self.assertIn("EXPECTED_RELEASE_SHA", self.deploy)
        self.assertIn('TARGET_SHA="$LATEST_RELEASE_SHA"', self.deploy)

    def test_non_release_main_tip_does_not_invalidate_release_gates(self) -> None:
        for workflow in (self.full_ci, self.security):
            self.assertIn('--ref "$CURRENT_MAIN"', workflow)
            self.assertIn('LATEST_RELEASE_SHA" == "$TARGET_SHA', workflow)
            self.assertNotIn('CURRENT_MAIN" == "$TARGET_SHA', workflow)

    def test_main_tip_is_not_treated_as_release_identity(self) -> None:
        self.assertNotIn('TARGET_SHA="$MANUAL_SHA"', self.deploy)
        self.assertNotIn('TARGET_SHA" != "$MAIN_SHA', self.deploy)
        self.assertNotIn('CURRENT_MAIN" != "$RELEASE_SHA', self.coordinator)


if __name__ == "__main__":
    unittest.main()
