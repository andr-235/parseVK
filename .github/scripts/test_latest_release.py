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
        for args in (
            ["init", "-q", "-b", "main"],
            ["config", "user.email", "test@example.com"],
            ["config", "user.name", "Test"],
        ):
            subprocess.run(  # noqa: S603 -- fixed executable and test-owned arguments
                [GIT, *args], cwd=self.repo, check=True
            )

    def commit(self, message: str) -> str:
        (self.repo / "state.txt").write_text(message + "\n", encoding="utf-8")
        for args in (["add", "state.txt"], ["commit", "-q", "-m", message]):
            subprocess.run(  # noqa: S603 -- fixed executable and test-owned arguments
                [GIT, *args], cwd=self.repo, check=True
            )
        return subprocess.run(  # noqa: S603 -- fixed executable and test-owned arguments
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
        self.assertEqual((resolved.sha, resolved.source_sha), (release, source))

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
        self.assertEqual((resolved.sha, resolved.source_sha), (valid, source))

    def test_missing_release_fails_closed(self) -> None:
        self.commit("refactor(api): no release")
        with self.assertRaises(latest_release.ReleaseResolutionError):
            latest_release.latest_release("main", cwd=self.repo)


class WorkflowContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        workflows = Path(__file__).resolve().parents[2] / ".github/workflows"
        cls.deploy = (workflows / "deploy.yml").read_text(encoding="utf-8")
        cls.coordinator = (workflows / "release-deploy-coordinator.yml").read_text(
            encoding="utf-8"
        )
        cls.full_ci = (workflows / "ci.yml").read_text(encoding="utf-8")
        cls.security = (workflows / "security.yml").read_text(encoding="utf-8")
        cls.publisher = (workflows / "publish-release-images.yml").read_text(
            encoding="utf-8"
        )
        cls.image = (workflows / "reusable-publish-image.yml").read_text(encoding="utf-8")

    def test_release_consumers_use_resolver(self) -> None:
        for workflow in (
            self.deploy,
            self.coordinator,
            self.full_ci,
            self.security,
            self.publisher,
            self.image,
        ):
            self.assertIn("latest_release.py", workflow)

    def test_historical_targets_use_staged_trusted_resolver(self) -> None:
        for workflow in (self.full_ci, self.security, self.publisher, self.image):
            self.assertIn("Checkout trusted release resolver", workflow)
            self.assertIn("github.workflow_sha", workflow)
            self.assertIn("$RUNNER_TEMP/latest_release.py", workflow)
            self.assertIn('python3 "$RUNNER_TEMP/latest_release.py"', workflow)
            self.assertNotIn("python3 .github/scripts/latest_release.py --ref", workflow)

    def test_catalog_include_matrices_are_not_wrapped_as_service(self) -> None:
        migration = "matrix: ${{ fromJSON(needs.prepare.outputs.migration_matrix) }}"
        docker = "matrix: ${{ fromJSON(needs.catalog.outputs.docker_matrix) }}"
        self.assertIn(migration, self.full_ci)
        self.assertIn(docker, self.security)
        self.assertNotIn("service: ${{ fromJSON(needs.prepare.outputs.migration_matrix) }}", self.full_ci)
        self.assertNotIn("service: ${{ fromJSON(needs.catalog.outputs.docker_matrix) }}", self.security)

    def test_manual_deploy_is_bound_to_expected_latest_release(self) -> None:
        self.assertIn('deployment: "latest-release"', self.coordinator)
        self.assertIn("expected_release_sha", self.coordinator)
        self.assertIn("EXPECTED_RELEASE_SHA", self.deploy)
        self.assertIn("release/immutable-ghcr", self.deploy)
        self.assertNotIn("workflow_run:", self.deploy)

    def test_non_release_main_tip_does_not_invalidate_pipeline(self) -> None:
        for workflow in (self.full_ci, self.security):
            self.assertIn('--ref "$CURRENT_MAIN"', workflow)
            self.assertNotIn('CURRENT_MAIN" == "$TARGET_SHA', workflow)
        for workflow in (self.publisher, self.image):
            self.assertIn('--ref "$MAIN_SHA"', workflow)
            self.assertNotIn('MAIN_SHA" != "$TARGET_SHA', workflow)


if __name__ == "__main__":
    unittest.main()
