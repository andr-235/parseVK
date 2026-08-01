from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / ".github/workflows/deploy.yml"
HEALTH = ROOT / ".github/scripts/health-check.sh"
VERIFY = ROOT / ".github/workflows/production-verification.yml"


class ProductionObservabilityContract(unittest.TestCase):
    def test_full_deploy_health_precedes_promotion(self) -> None:
        deploy = DEPLOY.read_text(encoding="utf-8")
        health = deploy.index("- name: Verify container health")
        promote = deploy.index("- name: Promote local release")
        metadata = deploy.index("- name: Update deployment metadata")
        self.assertLess(health, promote)
        self.assertLess(health, metadata)

        health_script = HEALTH.read_text(encoding="utf-8")
        self.assertIn('if [ "$FULL_DEPLOY" = "true" ]', health_script)
        self.assertIn("post_deploy_smoke.py", health_script)
        self.assertIn("SMOKE_REPORT", health_script)

    def test_scheduled_verification_is_read_only(self) -> None:
        text = VERIFY.read_text(encoding="utf-8")
        self.assertIn("schedule:", text)
        self.assertIn("runs-on: [self-hosted]", text)
        self.assertIn("post_deploy_smoke.py", text)
        self.assertIn("actions/upload-artifact@", text)
        for forbidden in ("docker build", "docker pull", "docker login", " promote ", " activate "):
            self.assertNotIn(forbidden, text)

    def test_evidence_generator_is_versioned(self) -> None:
        evidence = ROOT / ".github/scripts/production/deployment_evidence.py"
        text = evidence.read_text(encoding="utf-8")
        self.assertIn('"schema_version": 1', text)
        self.assertIn('"release_sha"', text)
        self.assertIn('"smoke"', text)


if __name__ == "__main__":
    unittest.main()
