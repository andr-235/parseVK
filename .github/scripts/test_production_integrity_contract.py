from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github/workflows/production-integrity.yml"
PREFLIGHT = ROOT / ".github/scripts/production/preflight.sh"
GUARD = ROOT / ".github/scripts/production/storage-guard.sh"
INTEGRITY = ROOT / ".github/scripts/production/storage-integrity.sh"


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
            "PRODUCTION_MIN_FREE_PROJECT_GB ||",
        ):
            self.assertNotIn(forbidden, text)

    def test_preflight_selects_rollback_without_disk_gate(self) -> None:
        text = PREFLIGHT.read_text(encoding="utf-8")
        self.assertIn('GITHUB_WORKFLOW:-}" = "Rollback Deployment"', text)
        self.assertIn('printf \'rollback\\n\'', text)
        self.assertIn('"$(integrity_mode)"', text)

    def test_guard_uses_server_thresholds_and_complete_manifests(self) -> None:
        guard = GUARD.read_text(encoding="utf-8")
        integrity = INTEGRITY.read_text(encoding="utf-8")
        self.assertIn("PRODUCTION_MIN_FREE_DOCKER_GB", guard)
        self.assertIn('read_server_setting "$key"', guard)
        self.assertIn("Release manifest image coverage is incomplete", integrity)
        self.assertIn('has("last_successful_commit")', integrity)

    def test_new_sources_respect_line_limit(self) -> None:
        for path in (GUARD, INTEGRITY, ROOT / ".github/scripts/test_storage_guard.py"):
            self.assertLessEqual(len(path.read_text(encoding="utf-8").splitlines()), 150)


if __name__ == "__main__":
    unittest.main()
