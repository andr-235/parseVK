from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
WORKFLOWS = ROOT / ".github" / "workflows"
INTEGRATION_BRANCH = "agent/p3-hard-cutover"
VALIDATION_WORKFLOWS = {
    "pr-ci.yml",
    "security.yml",
    "ai-code-review.yml",
}


def check_validation_workflows_accept_integration_pull_requests() -> None:
    expected = (
        "pull_request:\n"
        "    branches:\n"
        "      - main\n"
        f"      - {INTEGRATION_BRANCH}\n"
    )
    for name in sorted(VALIDATION_WORKFLOWS):
        text = (WORKFLOWS / name).read_text(encoding="utf-8")
        if expected not in text:
            raise AssertionError(
                f"{name} must accept pull requests targeting {INTEGRATION_BRANCH}"
            )


def check_only_validation_workflows_name_integration_branch() -> None:
    actual = {
        path.name
        for path in WORKFLOWS.glob("*.yml")
        if INTEGRATION_BRANCH in path.read_text(encoding="utf-8")
    }
    if actual != VALIDATION_WORKFLOWS:
        raise AssertionError(
            "integration branch must appear only in validation workflows: "
            f"expected={sorted(VALIDATION_WORKFLOWS)} actual={sorted(actual)}"
        )


def check_push_validation_remains_main_only() -> None:
    expected = "push:\n    branches:\n      - main\n"
    forbidden = (
        "push:\n"
        "    branches:\n"
        "      - main\n"
        f"      - {INTEGRATION_BRANCH}"
    )
    for name in ("pr-ci.yml", "security.yml"):
        text = (WORKFLOWS / name).read_text(encoding="utf-8")
        if expected not in text or forbidden in text:
            raise AssertionError(f"{name} push validation must remain main-only")


def main() -> None:
    check_validation_workflows_accept_integration_pull_requests()
    check_only_validation_workflows_name_integration_branch()
    check_push_validation_remains_main_only()
    print("P3 integration workflow target checks passed")


if __name__ == "__main__":
    main()
