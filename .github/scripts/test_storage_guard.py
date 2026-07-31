from __future__ import annotations

import unittest

from storage_guard_test_support import GuardFixture


class StorageGuardRuntimeTests(GuardFixture, unittest.TestCase):
    def setUp(self) -> None:
        self.setup_guard()

    def tearDown(self) -> None:
        self.teardown_guard()

    def test_first_deploy_without_metadata_is_allowed(self) -> None:
        result = self.run_guard()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_current_and_previous_releases_are_verified(self) -> None:
        current, previous = "a" * 40, "b" * 40
        self.write_metadata(current, previous)
        self.write_manifest(current)
        self.write_manifest(previous)
        result = self.run_guard()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.release_log.read_text().splitlines(), [current, previous])

    def test_low_docker_space_blocks_deploy_but_not_rollback(self) -> None:
        commit = "c" * 40
        self.write_metadata(commit)
        self.write_manifest(commit)
        low = {"FAKE_DOCKER_KB": str(512 * 1024)}
        self.assertNotEqual(self.run_guard(**low).returncode, 0)
        rollback = self.run_guard(
            "rollback", ROLLBACK_TARGET_COMMIT=commit, **low
        )
        self.assertEqual(rollback.returncode, 0, rollback.stderr)

    def test_server_env_threshold_is_used(self) -> None:
        (self.root / ".env").write_text(
            "PRODUCTION_MIN_FREE_DOCKER_GB=4\n", encoding="utf-8"
        )
        result = self.run_guard(MIN_FREE_DOCKER_GB="")
        self.assertNotEqual(result.returncode, 0)

    def test_boolean_metadata_is_rejected(self) -> None:
        self.write_metadata(False)
        result = self.run_guard()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Deployment metadata is invalid", result.stderr)

    def test_incomplete_manifest_is_rejected(self) -> None:
        commit = "d" * 40
        self.write_metadata(commit)
        self.write_manifest(commit, ("frontend",))
        result = self.run_guard()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("image coverage is incomplete", result.stderr)

    def test_broken_release_image_verification_blocks_deploy(self) -> None:
        commit = "e" * 40
        self.write_metadata(commit)
        self.write_manifest(commit)
        result = self.run_guard(FAIL_RELEASE=commit)
        self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
