from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GUARD = ROOT / ".github/scripts/production/storage-guard.sh"
WORKFLOW = ROOT / ".github/workflows/production-integrity.yml"
PREFLIGHT = ROOT / ".github/scripts/production/preflight.sh"


class StorageGuardRuntimeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.docker_root = self.root / "docker"
        self.docker_root.mkdir()
        self.release_log = self.root / "verified.log"
        self._write_fake_commands()
        self.local_release = self.root / "local-release.sh"
        self.local_release.write_text(
            "#!/usr/bin/env bash\n"
            '[[ "$1" == verify ]] || exit 70\n'
            'echo "$2" >> "$VERIFY_LOG"\n'
            '[[ "$2" != "${FAIL_RELEASE:-}" ]]\n',
            encoding="utf-8",
        )
        self.local_release.chmod(0o755)

    def tearDown(self) -> None:
        self.temp.cleanup()

    def _write_fake_commands(self) -> None:
        docker = self.bin / "docker"
        docker.write_text(
            "#!/usr/bin/env bash\n"
            '[[ "$1" == info ]] || exit 70\n'
            'printf "%s\\n" "$FAKE_DOCKER_ROOT"\n',
            encoding="utf-8",
        )
        docker.chmod(0o755)
        df = self.bin / "df"
        df.write_text(
            "#!/usr/bin/env bash\n"
            'available="$FAKE_PROJECT_KB"\n'
            '[[ "${@: -1}" != "$FAKE_DOCKER_ROOT" ]] || available="$FAKE_DOCKER_KB"\n'
            'printf "Filesystem 1024-blocks Used Available Capacity Mounted\\n"\n'
            'printf "fake 99999999 1 %s 1%% %s\\n" "$available" "${@: -1}"\n',
            encoding="utf-8",
        )
        df.chmod(0o755)

    def _env(self) -> dict[str, str]:
        return os.environ | {
            "PATH": f"{self.bin}:{os.environ['PATH']}",
            "PROJECT_ROOT": str(self.root),
            "FAKE_DOCKER_ROOT": str(self.docker_root),
            "FAKE_PROJECT_KB": str(3 * 1024 * 1024),
            "FAKE_DOCKER_KB": str(3 * 1024 * 1024),
            "MIN_FREE_PROJECT_GB": "1",
            "MIN_FREE_DOCKER_GB": "1",
            "LOCAL_RELEASE_SCRIPT": str(self.local_release),
            "DEPLOYMENT_METADATA_FILE": str(self.root / ".deployment-metadata.json"),
            "VERIFY_LOG": str(self.release_log),
        }

    def _run(self, **overrides: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["bash", str(GUARD), "check"],
            text=True,
            capture_output=True,
            check=False,
            env=self._env() | overrides,
        )

    def test_first_deploy_without_metadata_is_allowed(self) -> None:
        result = self._run()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertFalse(self.release_log.exists())

    def test_current_and_previous_releases_are_verified(self) -> None:
        metadata = {
            "last_successful_commit": "a" * 40,
            "previous_successful_commit": "b" * 40,
        }
        (self.root / ".deployment-metadata.json").write_text(
            json.dumps(metadata), encoding="utf-8"
        )
        result = self._run()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.release_log.read_text().splitlines(), ["a" * 40, "b" * 40])

    def test_low_docker_space_blocks_deploy(self) -> None:
        result = self._run(FAKE_DOCKER_KB=str(512 * 1024))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Docker filesystem has insufficient free space", result.stderr)

    def test_invalid_metadata_blocks_deploy(self) -> None:
        (self.root / ".deployment-metadata.json").write_text("{broken", encoding="utf-8")
        result = self._run()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Deployment metadata is invalid", result.stderr)

    def test_broken_rollback_release_blocks_deploy(self) -> None:
        commit = "c" * 40
        (self.root / ".deployment-metadata.json").write_text(
            json.dumps({"last_successful_commit": commit}), encoding="utf-8"
        )
        result = self._run(FAIL_RELEASE=commit)
        self.assertNotEqual(result.returncode, 0)


class ProductionIntegrityContractTests(unittest.TestCase):
    def test_workflow_is_read_only_and_self_hosted(self) -> None:
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("schedule:", text)
        self.assertIn("workflow_dispatch:", text)
        self.assertIn("runs-on: [self-hosted]", text)
        self.assertIn("storage-guard.sh", text)
        for forbidden in (
            "docker pull",
            "docker build",
            "docker login",
            "local-release.sh promote",
        ):
            self.assertNotIn(forbidden, text)

    def test_preflight_runs_guard_before_build(self) -> None:
        text = PREFLIGHT.read_text(encoding="utf-8")
        self.assertIn("storage-guard.sh", text)
        self.assertIn("check_storage_integrity", text)


if __name__ == "__main__":
    unittest.main()
