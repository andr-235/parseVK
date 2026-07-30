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

    def test_source_workflow_evaluates_but_does_not_publish_verdict(self) -> None:
        self.assertIn("name: Evaluate review verdict", self.source)
        self.assertIn("Evaluate validated verdict without publishing", self.source)
        self.assertNotIn("name: Publish review verdict", self.source)
        self.assertNotIn('python "$AI_REVIEW_SCRIPT" publish', self.source)

    def test_verdict_job_has_no_github_write_permissions(self) -> None:
        verdict = self.source.split("  verdict:\n", 1)[1].split("  cleanup:\n", 1)[0]
        self.assertIn("actions: read", verdict)
        self.assertNotIn("issues: write", verdict)
        self.assertNotIn("pull-requests: write", verdict)

    def test_default_branch_publisher_owns_final_writes(self) -> None:
        self.assertIn("workflow_run:", self.publisher)
        self.assertIn("Publish final reactions and Pull Request review", self.publisher)
        self.assertIn("issues: write", self.publisher)
        self.assertIn("pull-requests: write", self.publisher)
        self.assertIn("ai-review-final-", self.publisher)


if __name__ == "__main__":
    unittest.main()
