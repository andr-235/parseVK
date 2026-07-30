from __future__ import annotations

import unittest
from pathlib import Path

SOURCE_WORKFLOW = Path(".github/workflows/ai-code-review.yml")
PUBLISHER_WORKFLOW = Path(".github/workflows/ai-review-inline-publisher.yml")


class WorkflowContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.source = SOURCE_WORKFLOW.read_text(encoding="utf-8")
        cls.publisher = PUBLISHER_WORKFLOW.read_text(encoding="utf-8")

    def test_source_workflow_evaluates_without_publishing_review(self) -> None:
        self.assertIn("name: Evaluate review verdict", self.source)
        self.assertIn("Evaluate validated verdict without publishing", self.source)
        self.assertNotIn("name: Publish review verdict", self.source)
        self.assertNotIn('python "$AI_REVIEW_SCRIPT" publish', self.source)

    def test_verdict_job_has_no_github_write_permissions(self) -> None:
        verdict = self.source.split("  verdict:\n", 1)[1].split("  status:\n", 1)[0]
        self.assertIn("actions: read", verdict)
        self.assertNotIn("issues: write", verdict)
        self.assertNotIn("pull-requests: write", verdict)

    def test_source_owns_head_guarded_status_reactions(self) -> None:
        status = self.source.split("  status:\n", 1)[1].split("  cleanup:\n", 1)[0]
        self.assertIn("name: Publish review status", status)
        self.assertIn("actions: read", status)
        self.assertIn("pull-requests: write", status)
        self.assertIn("current_head != expected_head", status)
        self.assertIn('"approved": "+1"', status)
        self.assertIn('"changes-required": "-1"', status)
        self.assertIn('"findings": "confused"', status)
        self.assertIn('"unavailable": "confused"', status)
        self.assertIn('user.get("login") != "github-actions[bot]"', status)

    def test_default_branch_publisher_owns_review_comments(self) -> None:
        self.assertIn("workflow_run:", self.publisher)
        self.assertIn("Publish final reactions and Pull Request review", self.publisher)
        self.assertIn("pull-requests: write", self.publisher)
        self.assertIn("ai-review-final-", self.publisher)

    def test_missing_artifact_recovery_is_head_guarded(self) -> None:
        self.assertIn("Clear processing reaction when artifact is missing", self.publisher)
        self.assertIn("clear-processing", self.publisher)
        self.assertIn("github.event.workflow_run.head_sha", self.publisher)
        self.assertIn('--expected-head "$EXPECTED_HEAD"', self.publisher)


if __name__ == "__main__":
    unittest.main()
