from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEPLOY = ROOT / ".github/workflows/deploy.yml"
HEALTH = ROOT / ".github/scripts/health-check.sh"
VERIFY = ROOT / ".github/workflows/production-verification.yml"
RECORDER = ROOT / ".github/workflows/reusable-record-production-deploy.yml"


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

    def test_deploy_completion_records_actual_context(self) -> None:
        deploy = DEPLOY.read_text(encoding="utf-8")
        orchestration = VERIFY.read_text(encoding="utf-8")
        recorder = RECORDER.read_text(encoding="utf-8")
        target_name = "production-deploy-target-${{ github.run_id }}-${{ github.run_attempt }}"
        execution_name = "production-deploy-execution-${{ github.run_id }}-${{ github.run_attempt }}"
        self.assertIn(target_name, deploy)
        self.assertIn(execution_name, deploy)
        self.assertIn("skip_deploy", deploy)
        self.assertIn("workflow_run:", orchestration)
        self.assertIn("Deploy to Production Server", orchestration)
        self.assertNotIn("github.event.workflow_run.head_sha", orchestration)
        self.assertIn("reusable-record-production-deploy.yml", orchestration)
        self.assertIn("actions/download-artifact@", recorder)
        self.assertIn("run-id: ${{ inputs.deploy_run_id }}", recorder)
        self.assertIn("inputs.deploy_run_attempt", recorder)
        self.assertIn("latest_release.py --ref \"$TARGET_SHA\"", recorder)
        self.assertIn("--skipped \"$SKIPPED\"", recorder)
        self.assertIn("release/production", recorder)
        self.assertIn("deployment_evidence.py", recorder)
        self.assertIn("actions/upload-artifact@", recorder)
        self.assertIn("github.run_attempt", recorder)
        self.assertIn("statuses: write", recorder)
        self.assertIn("Finalize Production Release Status", recorder)
        self.assertNotIn("git fetch --no-tags origin", recorder)
        self.assertNotIn("gh api", recorder)

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
