from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"
INTEGRATION_BRANCH = "agent/p3-hard-cutover"
VALIDATION_WORKFLOWS = {
    "pr-ci.yml",
    "security.yml",
    "ai-code-review.yml",
}


class IntegrationWorkflowTargetTests(unittest.TestCase):
    def test_validation_workflows_accept_integration_pull_requests(self) -> None:
        expected = (
            "pull_request:\n"
            "    branches:\n"
            "      - main\n"
            f"      - {INTEGRATION_BRANCH}\n"
        )
        for name in sorted(VALIDATION_WORKFLOWS):
            with self.subTest(workflow=name):
                text = (WORKFLOWS / name).read_text(encoding="utf-8")
                self.assertIn(expected, text)

    def test_only_validation_workflows_name_integration_branch(self) -> None:
        actual = {
            path.name
            for path in WORKFLOWS.glob("*.yml")
            if INTEGRATION_BRANCH in path.read_text(encoding="utf-8")
        }
        self.assertEqual(actual, VALIDATION_WORKFLOWS)

    def test_push_validation_remains_main_only(self) -> None:
        expected = "push:\n    branches:\n      - main\n"
        for name in ("pr-ci.yml", "security.yml"):
            with self.subTest(workflow=name):
                text = (WORKFLOWS / name).read_text(encoding="utf-8")
                self.assertIn(expected, text)
                self.assertNotIn(
                    f"push:\n    branches:\n      - main\n      - {INTEGRATION_BRANCH}",
                    text,
                )


if __name__ == "__main__":
    unittest.main()
