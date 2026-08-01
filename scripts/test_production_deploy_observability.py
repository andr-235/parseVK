from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / ".github/workflows/deploy.yml"
VERIFY = ROOT / ".github/workflows/production-verification.yml"


class ProductionObservabilityContract(unittest.TestCase):
    def test_deploy_smoke_precedes_promotion(self) -> None:
        text = DEPLOY.read_text(encoding="utf-8")
        smoke = text.index("- name: Verify production HTTP entrypoints")
        promote = text.index("- name: Promote local release")
        metadata = text.index("- name: Update deployment metadata")
        self.assertLess(smoke, promote)
        self.assertLess(smoke, metadata)
        self.assertIn("post_deploy_smoke.py", text)

    def test_deploy_publishes_evidence_and_status(self) -> None:
        text = DEPLOY.read_text(encoding="utf-8")
        self.assertIn("release/production", text)
        self.assertIn("deployment_evidence.py", text)
        self.assertIn("actions/upload-artifact@", text)
        self.assertIn("if: always()", text)
        self.assertIn("statuses: write", text)

    def test_scheduled_verification_is_read_only(self) -> None:
        text = VERIFY.read_text(encoding="utf-8")
        self.assertIn("schedule:", text)
        self.assertIn("runs-on: [self-hosted]", text)
        self.assertIn("post_deploy_smoke.py", text)
        for forbidden in ("docker build", "docker pull", "docker login", " promote ", " activate "):
            self.assertNotIn(forbidden, text)


if __name__ == "__main__":
    unittest.main()
