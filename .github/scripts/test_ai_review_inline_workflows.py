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

    def test_source_plans_commit_scoped_reviews(self) -> None:
        self.assertIn("name: Plan commit reviews", self.source)
        self.assertIn("BEFORE_SHA: ${{ github.event.before }}", self.source)
        self.assertIn("matrix:", self.source)
        self.assertIn("unit: ${{ fromJSON(needs.plan.outputs.matrix) }}", self.source)
        self.assertIn("${{ matrix.unit.base_sha }}", self.source)
        self.assertIn("${{ matrix.unit.head_sha }}", self.source)

    def test_rapid_pushes_do_not_cancel_previous_commit_review(self) -> None:
        self.assertIn("cancel-in-progress: false", self.source)
        self.assertIn("max-parallel: 4", self.source)
        self.assertIn("Check commit still belongs to Pull Request", self.source)
        self.assertIn("obsolete-commit", self.source)

    def test_each_commit_uploads_unique_validated_result(self) -> None:
        self.assertIn("ai-review-commit-${{ github.run_id }}-", self.source)
        self.assertIn('".ai-review-artifact/${HEAD_SHA}.json"', self.source)
        self.assertIn("pattern: ai-review-commit-${{ github.run_id }}-*", self.source)
        self.assertIn("name: ai-review-result-${{ github.run_id }}", self.source)

    def test_verdict_aggregates_without_publishing_reviews(self) -> None:
        verdict = self.source.split("  verdict:\n", 1)[1].split("  status:\n", 1)[0]
        self.assertIn("name: Evaluate review verdict", verdict)
        self.assertIn("Aggregate commit review results", verdict)
        self.assertNotIn("pull-requests: write", verdict)
        self.assertNotIn("issues: write", verdict)
        self.assertNotIn("create_review", verdict)

    def test_source_owns_only_head_guarded_status_reaction(self) -> None:
        status = self.source.split("  status:\n", 1)[1].split("  cleanup:\n", 1)[0]
        self.assertIn("name: Publish review status", status)
        self.assertIn("current_head != expected_head", status)
        self.assertIn('"approved": "+1"', status)
        self.assertIn('"changes-required": "-1"', status)
        self.assertIn('"unavailable": "confused"', status)

    def test_default_branch_publisher_owns_commit_reviews(self) -> None:
        self.assertIn("workflow_run:", self.publisher)
        self.assertIn("Publish commit-scoped Pull Request reviews", self.publisher)
        self.assertIn("ai_review_batch_publisher.py", self.publisher)
        self.assertIn("pull-requests: write", self.publisher)
        self.assertIn("ai-review-final-", self.publisher)

    def test_missing_artifact_recovery_is_head_guarded(self) -> None:
        self.assertIn("Clear processing reaction when artifact is missing", self.publisher)
        self.assertIn("clear-processing", self.publisher)
        self.assertIn("github.event.workflow_run.head_sha", self.publisher)


if __name__ == "__main__":
    unittest.main()
