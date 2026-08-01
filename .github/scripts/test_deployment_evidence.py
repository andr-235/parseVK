from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / ".github/scripts/production/deployment_evidence.py"
SHA = "a" * 40
PREVIOUS = "b" * 40


class EvidenceTest(unittest.TestCase):
    def test_evidence_contains_release_and_smoke(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            smoke = root / "smoke.json"
            output = root / "evidence.json"
            smoke.write_text('{"success": true, "checks": []}\n', encoding="utf-8")
            result = subprocess.run(  # noqa: S603
                [
                    sys.executable,
                    str(SCRIPT),
                    "--release-sha",
                    SHA,
                    "--active-sha",
                    SHA,
                    "--previous-sha",
                    PREVIOUS,
                    "--deployment-status",
                    "success",
                    "--skipped",
                    "false",
                    "--repository",
                    "andr-235/parseVK",
                    "--run-id",
                    "123",
                    "--run-attempt",
                    "1",
                    "--smoke-report",
                    str(smoke),
                    "--output",
                    str(output),
                ],
                check=False,
                text=True,
                capture_output=True,
            )
            payload = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(result.returncode, 0)
            self.assertEqual(payload["release_sha"], SHA)
            self.assertEqual(payload["previous_release_sha"], PREVIOUS)
            self.assertTrue(payload["release_matches_active"])
            self.assertTrue(payload["smoke"]["success"])


if __name__ == "__main__":
    unittest.main()
