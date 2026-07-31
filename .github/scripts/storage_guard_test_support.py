from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GUARD = ROOT / ".github/scripts/production/storage-guard.sh"


class GuardFixture:
    def setup_guard(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.bin = self.root / "bin"
        self.bin.mkdir()
        self.docker_root = self.root / "docker"
        self.docker_root.mkdir()
        self.release_log = self.root / "verified.log"
        self.catalog = self.root / "catalog.py"
        self.catalog.write_text("print('frontend api-gateway')\n", encoding="utf-8")
        self.local_release = self.root / "local-release.sh"
        self.local_release.write_text(
            "#!/usr/bin/env bash\n"
            '[[ "$1" == verify ]] || exit 70\n'
            'echo "$2" >> "$VERIFY_LOG"\n'
            '[[ "$2" != "${FAIL_RELEASE:-}" ]]\n',
            encoding="utf-8",
        )
        self.local_release.chmod(0o755)
        self._write_fake_commands()

    def teardown_guard(self) -> None:
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

    def guard_env(self) -> dict[str, str]:
        return os.environ | {
            "PATH": f"{self.bin}:{os.environ['PATH']}",
            "PROJECT_ROOT": str(self.root),
            "FAKE_DOCKER_ROOT": str(self.docker_root),
            "FAKE_PROJECT_KB": str(3 * 1024 * 1024),
            "FAKE_DOCKER_KB": str(3 * 1024 * 1024),
            "MIN_FREE_PROJECT_GB": "1",
            "MIN_FREE_DOCKER_GB": "1",
            "LOCAL_RELEASE_SCRIPT": str(self.local_release),
            "SERVICE_CATALOG_CLI": str(self.catalog),
            "DEPLOYMENT_METADATA_FILE": str(self.root / ".deployment-metadata.json"),
            "VERIFY_LOG": str(self.release_log),
        }

    def run_guard(
        self, command: str = "check", **overrides: str
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(  # noqa: S603 -- controlled test executable
            ["/usr/bin/bash", str(GUARD), command],
            text=True,
            capture_output=True,
            check=False,
            env=self.guard_env() | overrides,
        )

    def write_manifest(
        self,
        commit: str,
        targets: tuple[str, ...] = ("frontend", "api-gateway"),
    ) -> None:
        images = {
            target: {
                "active_ref": f"parsevk-{target}:latest",
                "release_ref": f"parsevk-release/{target}:sha-{commit}",
                "image_id": f"sha256:{target}",
            }
            for target in targets
        }
        path = self.root / ".releases" / commit / "release.json"
        path.parent.mkdir(parents=True)
        path.write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "commit_sha": commit,
                    "status": "successful",
                    "images": images,
                }
            ),
            encoding="utf-8",
        )

    def write_metadata(self, current: object = None, previous: object = None) -> None:
        value = {}
        if current is not None:
            value["last_successful_commit"] = current
        if previous is not None:
            value["previous_successful_commit"] = previous
        (self.root / ".deployment-metadata.json").write_text(
            json.dumps(value), encoding="utf-8"
        )
